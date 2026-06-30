import { ClientWrapper } from '@/components/ClientWrapper';
import "./globals.css";

export const metadata = {
  title: "WHITECLUB | Portal de Elite",
  description: "Plataforma de alta performance para mentores, mentorados e co-investidores. Grupo CLS.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
