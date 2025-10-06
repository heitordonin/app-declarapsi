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

interface DueReminderProps {
  clientName: string
  obligationName: string
  competence: string
  dueAt: string
  amount?: string
  clientAreaLink: string
}

export const DueReminder = ({
  clientName,
  obligationName,
  competence,
  dueAt,
  amount,
  clientAreaLink,
}: DueReminderProps) => (
  <Html>
    <Head />
    <Preview>⚠️ Documento vencendo hoje - {obligationName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ Documento Vencendo Hoje</Heading>
        <Text style={text}>
          Olá <strong>{clientName}</strong>,
        </Text>
        <Text style={textAlert}>
          Este é um lembrete de que o seguinte documento vence <strong>hoje</strong>:
        </Text>
        <Container style={alertBox}>
          <Text style={infoText}>
            <strong>Obrigação:</strong> {obligationName}
          </Text>
          <Text style={infoText}>
            <strong>Competência:</strong> {competence}
          </Text>
          <Text style={infoText}>
            <strong>Vencimento:</strong> {dueAt}
          </Text>
          {amount && (
            <Text style={infoText}>
              <strong>Valor:</strong> R$ {amount}
            </Text>
          )}
        </Container>
        <Text style={text}>
          Não se esqueça de acessar sua área do cliente para baixar e processar este documento antes do vencimento.
        </Text>
        <Link
          href={clientAreaLink}
          target="_blank"
          style={button}
        >
          Acessar Área do Cliente
        </Link>
        <Text style={footer}>
          Declara Psi - Gestão de Obrigações
        </Text>
      </Container>
    </Body>
  </Html>
)

export default DueReminder

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
  color: '#dc3545',
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

const textAlert = {
  color: '#dc3545',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '16px 0',
}

const alertBox = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #dc3545',
  borderRadius: '5px',
  padding: '20px',
  margin: '24px 40px',
}

const infoText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
}

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '240px',
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
