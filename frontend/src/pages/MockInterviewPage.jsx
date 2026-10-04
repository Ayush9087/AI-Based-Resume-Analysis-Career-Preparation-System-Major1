import InterviewPreparationDashboard from '../components/InterviewPreparationDashboard';

export default function MockInterviewPage() {
  return (
    <InterviewPreparationDashboard
      mode="mock"
      title="Mock Interview"
      subtitle="Run a complete interview simulation, answer one question at a time, and review your performance report."
      startLabel="Start mock interview"
    />
  );
}