import {
  Html, Head, Body, Container, Section, Text, Button, Heading, Preview,
} from "@react-email/components";

interface TaskAssignedEmailProps {
  recipientName: string;
  assignerName: string;
  taskCode: string;
  taskTitle: string;
  boardName: string;
  taskUrl: string;
}

export function TaskAssignedEmail({
  assignerName,
  taskCode,
  taskTitle,
  boardName,
  taskUrl,
}: TaskAssignedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{taskCode}: {taskTitle} was assigned to you</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>Axiom</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>Task assigned to you</Heading>

            <Text style={styles.text}>
              {assignerName} assigned you to a task in{" "}
              <strong style={{ color: "#dfe2f1" }}>{boardName}</strong>.
            </Text>

            <Section style={styles.taskCard}>
              <Text style={styles.taskCode}>{taskCode}</Text>
              <Text style={styles.taskTitle}>{taskTitle}</Text>
            </Section>

            <Button style={styles.button} href={taskUrl}>
              View task
            </Button>

            <Text style={styles.footer}>
              You are receiving this because you are a member of this workspace.
            </Text>
          </Section>

          <Text style={styles.unsubscribeNote}>Axiom</Text>
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
  card: { backgroundColor: "#1c1f2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px" },
  heading: { color: "#dfe2f1", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" },
  text: { color: "#c2c6d6", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" },
  taskCard: { backgroundColor: "#262a35", borderRadius: "12px", padding: "16px", margin: "16px 0" },
  taskCode: { color: "#8B5CF6", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", margin: "0 0 4px", fontFamily: "monospace" },
  taskTitle: { color: "#dfe2f1", fontSize: "16px", fontWeight: "600", margin: 0 },
  button: { backgroundColor: "#3B82F6", color: "#ffffff", borderRadius: "12px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "block", textAlign: "center" as const, margin: "24px 0" },
  footer: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.6" },
  unsubscribeNote: { color: "#424754", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" },
};
