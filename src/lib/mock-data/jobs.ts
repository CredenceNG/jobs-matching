// Mock job data for development and testing

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
}

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120,000 - $180,000",
    description:
      "We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building user-facing features using React, TypeScript, and modern web technologies. The ideal candidate has 5+ years of experience with React ecosystem and a passion for creating exceptional user experiences.",
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "New York, NY",
    type: "Full-time",
    salary: "$100,000 - $150,000",
    description:
      "Join our dynamic startup as a Full Stack Engineer. Work with cutting-edge technologies and help build products that impact millions of users worldwide. We use Node.js, React, PostgreSQL, and deploy on AWS. Looking for someone with 3-5 years of experience.",
  },
  {
    id: "3",
    title: "Product Manager",
    company: "InnovateCorp",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$110,000 - $160,000",
    description:
      "We are seeking a talented Product Manager to help shape our product roadmap and work closely with engineering and design teams. The ideal candidate has experience with SaaS products, user research, and data-driven decision making.",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    location: "Seattle, WA",
    type: "Full-time",
    salary: "$110,000 - $160,000",
    description:
      "Looking for a DevOps Engineer to help scale our infrastructure. You will work with Kubernetes, AWS, and modern CI/CD pipelines. Experience with Infrastructure as Code and monitoring tools is highly valued.",
  },
  {
    id: "5",
    title: "Data Scientist",
    company: "AI Innovations",
    location: "Boston, MA",
    type: "Full-time",
    salary: "$95,000 - $140,000",
    description:
      "Join our AI team as a Data Scientist. Work on cutting-edge machine learning projects and help drive data-driven decisions. Experience with Python, TensorFlow, and statistical analysis required.",
  },
  {
    id: "6",
    title: "Backend Developer",
    company: "MegaCorp Enterprise",
    location: "Chicago, IL",
    type: "Contract",
    salary: "$80 - $120/hour",
    description:
      "Contract position for an experienced Backend Developer. Work on high-scale systems processing millions of requests daily. Strong experience with Java, Spring Boot, and microservices architecture required.",
  },
  {
    id: "7",
    title: "UX Designer",
    company: "Design Studio Pro",
    location: "Remote",
    type: "Full-time",
    salary: "$85,000 - $125,000",
    description:
      "We are seeking a talented UX Designer to help create beautiful, intuitive user experiences. You will work closely with our product and engineering teams to design and prototype new features.",
  },
  {
    id: "8",
    title: "Mobile Developer (React Native)",
    company: "MobileFirst Inc.",
    location: "Los Angeles, CA",
    type: "Full-time",
    salary: "$105,000 - $155,000",
    description:
      "Looking for a skilled Mobile Developer to build cross-platform mobile applications using React Native. Experience with both iOS and Android development preferred.",
  },
  {
    id: "9",
    title: "Software Engineering Manager",
    company: "TechGiant Corp",
    location: "Mountain View, CA",
    type: "Full-time",
    salary: "$180,000 - $250,000",
    description:
      "Lead a team of talented engineers in building next-generation software products. We are looking for someone with both technical depth and strong leadership skills to guide our engineering organization.",
  },
  {
    id: "10",
    title: "Machine Learning Engineer",
    company: "AI Research Labs",
    location: "Cambridge, MA",
    type: "Full-time",
    salary: "$130,000 - $190,000",
    description:
      "Build and deploy machine learning models at scale. Work with large datasets and cutting-edge ML frameworks. Experience with MLOps and model deployment in production environments required.",
  },
  {
    id: "11",
    title: "Cybersecurity Analyst",
    company: "SecureNet Technologies",
    location: "Washington, DC",
    type: "Full-time",
    salary: "$90,000 - $135,000",
    description:
      "Protect our organization from cyber threats by monitoring security systems, investigating incidents, and implementing security measures. CISSP or similar certification preferred.",
  },
  {
    id: "12",
    title: "Cloud Architect",
    company: "CloudFirst Solutions",
    location: "Denver, CO",
    type: "Full-time",
    salary: "$140,000 - $200,000",
    description:
      "Design and implement scalable cloud infrastructure solutions using AWS, Azure, and GCP. Lead cloud migration projects and establish best practices for cloud adoption across the organization.",
  },
];

export const getMockJobsForMatching = (count: number = 12): Job[] => {
  return mockJobs.slice(0, count);
};
