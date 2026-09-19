import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import {
  linkOAuthAccount,
  findUserByEmail,
  upsertOAuthUser,
} from "./lib/auth-users";
import { verifyPassword } from "./lib/password";
import { getServerEnv } from "./lib/server-env";

const googleId = getServerEnv("AUTH_GOOGLE_ID");
const googleSecret = getServerEnv("AUTH_GOOGLE_SECRET");
const githubId = getServerEnv("AUTH_GITHUB_ID");
const githubSecret = getServerEnv("AUTH_GITHUB_SECRET");

const providers = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email : "";
      const password =
        typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const user = await findUserByEmail(email);
      if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
  ...(googleId && googleSecret
    ? [Google({ clientId: googleId, clientSecret: googleSecret })]
    : []),
  ...(githubId && githubSecret
    ? [GitHub({ clientId: githubId, clientSecret: githubSecret })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getServerEnv("AUTH_SECRET"),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) token.sub = user.id;

      if (account && account.provider !== "credentials" && user?.email) {
        const appUser = await upsertOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
        });
        await linkOAuthAccount({
          userId: appUser.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });
        token.sub = appUser.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
