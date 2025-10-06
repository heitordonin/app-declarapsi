import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  clientName: string
  magicLink: string
}

export const WelcomeEmail = ({
  clientName,
  magicLink,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo ao Declara Psi - Configure sua senha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao Declara Psi!</Heading>
        <Text style={text}>
          Olá <strong>{clientName}</strong>,
        </Text>
        <Text style={text}>
          Seu cadastro foi realizado com sucesso no sistema Declara Psi. 
          Para acessar sua área do cliente e definir sua senha, clique no link abaixo:
        </Text>
        <Link
          href={magicLink}
          target="_blank"
          style={button}
        >
          Configurar Minha Senha
        </Link>
        <Text style={textSmall}>
          Este link é válido por 24 horas e pode ser usado apenas uma vez.
        </Text>
        <Text style={textSmall}>
          Se você não solicitou este cadastro, pode ignorar este email com segurança.
        </Text>
        <Text style={footer}>
          Declara Psi - Gestão de Obrigações
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '16px 0',
}

const textSmall = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '0 40px',
  margin: '8px 0',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '14px',
  margin: '24px auto',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '32px',
}
