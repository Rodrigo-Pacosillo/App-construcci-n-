import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { loginSchema } from "./validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.usuario.findUnique({
          where: { email },
        });

        if (!user || !user.activo) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: `${user.nombre} ${user.apellidos}`,
          email: user.email,
          role: user.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      // Refrescar rol desde BD cuando se actualiza la sesión (ej. admin cambia rol de usuario)
      if (trigger === "update" && token.sub) {
        const updatedUser = await prisma.usuario.findUnique({
          where: { id: token.sub },
          select: { rol: true, activo: true },
        });
        if (updatedUser) {
          token.role = updatedUser.rol;
          // Opcional: forzar logout si usuario fue desactivado
          // if (!updatedUser.activo) return null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
    };
  }
}
