import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Heading, Preview,
} from "@react-email/components";

interface WelcomeEmailProps {
  userName: string;
  appUrl: string;
}

export function WelcomeEmail({ userName, appUrl }: WelcomeEmailProps) {
  const APP_URL = appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://axiom-kanban.vercel.app";

  return (
    <Html>
      <Head />
      <Preview>Welcome to Axiom — your workspace is ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>Axiom</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>
              Welcome to Axiom, {userName}.
            </Heading>

            <Text style={styles.text}>
              Your account is set up. Here is what Axiom can do for you:
            </Text>

            {[
              {
                title: "Kanban board",
                desc: "Organize your work into columns. Drag tasks across stages.",
              },
              {
                title: "Axiom Intelligence",
                desc: "Open any task and get AI suggestions: priority, estimation, blocker detection.",
              },
              {
                title: "Sprint analytics",
                desc: "Track velocity and burndown across sprints, without manual data entry.",
              },
            ].map((feature) => (
              <Section key={feature.title} style={styles.feature}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </Section>
            ))}

            <Button style={styles.button} href={`${APP_URL}/workspaces/new`}>
              Create your first board
            </Button>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              If you did not sign up for Axiom, you can safely ignore this email.
            </Text>
          </Section>

          <Text style={styles.unsubscribeNote}>Axiom — AI-powered Kanban</Text>
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
  feature: { marginBottom: "12px" },
  featureTitle: { color: "#dfe2f1", fontSize: "14px", fontWeight: "600", margin: "0 0 2px" },
  featureDesc: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.5", margin: 0 },
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
