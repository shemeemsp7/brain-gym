// backend/pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { query } from "../../../db";
import bcrypt from "bcrypt";
import { getBeltForUser } from "../../../src/belt";
import { checkRateLimit } from "../../../src/rateLimit";

function debugLog(...args) {
  if (process.env.DEBUG === "true") {
    // eslint-disable-next-line no-console
    console.log("[DEBUG]", ...args);
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const { email, password } = credentials || {};
        if (!email || !password) return null;

        if (!checkRateLimit(req, "login", 10, 60_000)) {
          debugLog("Login rate limit exceeded");
          return null;
        }

        debugLog("Credentials login attempt for:", email);
        const result = await query(
          "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
          [email]
        );
        if (result.rows.length === 0) return null;
        const user = result.rows[0];
        if (!user.password_hash) return null;
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return null;

        const belt = await getBeltForUser(user.id);

        // Never return (or log) password_hash.
        const { password_hash, ...userInfo } = user;
        userInfo.belt = belt;
        debugLog("Authorized user:", userInfo.id, "belt:", belt);
        return userInfo;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: "read:user user:email"
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.belt = user.belt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        // Always fetch role from DB so role changes take effect without re-login
        const result = await query(
          "SELECT role FROM users WHERE id = $1",
          [token.id]
        );
        session.user.role = result.rows[0]?.role || token.role || null;

        // For social logins the token has no belt yet — compute from stats
        session.user.belt = token.belt || (token.id ? await getBeltForUser(token.id) : "white");
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        const id = profile?.sub || profile?.id || user.id;
        const name = profile?.name || user.name || "";
        const email = profile?.email || user.email || "";
        const image = profile?.picture || profile?.avatar_url || user.image || "";
        const provider = account.provider;
        const provider_account_id = account.providerAccountId || id;

        debugLog("Upserting social-login user:", id, provider);
        await query(
          `INSERT INTO users (id, name, email, image, provider, provider_account_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             image = EXCLUDED.image,
             provider = EXCLUDED.provider,
             provider_account_id = EXCLUDED.provider_account_id`,
          [id, name, email, image, provider, provider_account_id]
        );
      }
    }
  },
  pages: {
    signIn: "/login"
  }
};

export default NextAuth(authOptions);
