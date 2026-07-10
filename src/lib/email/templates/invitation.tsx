import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Heading, Preview,
} from "@react-email/components";

interface InvitationEmailProps {
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}

export function InvitationEmail({
  workspaceName,
  inviterName,
  role,
  inviteUrl,
  expiresInDays,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to join {workspaceName} on Axiom</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>Axiom</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>
              You have been invited to {workspaceName}
            </Heading>

            <Text style={styles.text}>
              {inviterName} has invited you to join{" "}
              <strong style={{ color: "#dfe2f1" }}>{workspaceName}</strong> as{" "}
              <strong style={{ color: "#dfe2f1" }}>{role}</strong>.
            </Text>

            <Text style={styles.text}>
              Axiom is an AI-powered Kanban board for engineering teams.
            </Text>

            <Button style={styles.button} href={inviteUrl}>
              Accept invitation
            </Button>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              This invitation expires in {expiresInDays} days. If you did not expect this
              invitation, you can safely ignore this email.
            </Text>
          </Section>

          <Text style={styles.unsubscribeNote}>
            Axiom · You received this because you were invited to a workspace.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#0b0f19", fontFamily: "system-ui, -apple-system, sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  logoSection: { marginBottom: "32px" },
  logo: { color: "#3B82F6", fontSize: "20px", fontWeight: "700", margin: 0 },
  card: {
    backgroundColor: "#1c1f2a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "32px",
  },
  heading: { color: "#dfe2f1", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" },
  text: { color: "#c2c6d6", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" },
  button: {
    backgroundColor: "#3B82F6",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    display: "block",
    textAlign: "center" as const,
    margin: "24px 0",
  },
  hr: { borderColor: "rgba(255,255,255,0.08)", margin: "24px 0" },
  footer: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.6" },
  unsubscribeNote: { color: "#424754", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" },
};
