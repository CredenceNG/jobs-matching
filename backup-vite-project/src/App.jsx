import React, { useState, useMemo } from "react";
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Filter,
  Save,
  Send,
  CheckCircle,
  User,
  FileText,
  Settings,
  Bell,
  Crown,
  X,
  Mail,
  Smartphone,
  Zap,
} from "lucide-react";

const JobSearchAgent = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [filters, setFilters] = useState({
    jobType: "all",
    experience: "all",
    salary: "all",
    remote: false,
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      message: '3 new jobs match your "Senior Developer in SF" search',
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      message: "Price drop: Senior Full Stack Developer now $120k-$180k",
      time: "1 day ago",
      read: false,
    },
    {
      id: 3,
      message: "TechCorp Inc viewed your profile",
      time: "2 days ago",
      read: true,
    },
  ]);
  const [userProfile, setUserProfile] = useState({
    name: "Alex Johnson",
    title: "Full Stack Developer",
    experience: "5 years",
    skills: ["React", "Node.js", "Python", "AWS", "MongoDB"],
  });

  const jobListings = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      company: "TechCorp Inc",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$120k - $180k",
      experience: "Senior",
      remote: true,
      postedDays: 2,
      matchScore: 95,
      description:
        "Looking for an experienced full stack developer to lead our product development.",
      requirements: ["React", "Node.js", "AWS", "5+ years experience"],
      benefits: ["Health Insurance", "401k", "Remote Work", "Stock Options"],
    },
    {
      id: 2,
      title: "Frontend React Developer",
      company: "StartupXYZ",
      location: "New York, NY",
      type: "Full-time",
      salary: "$100k - $140k",
      experience: "Mid-level",
      remote: true,
      postedDays: 1,
      matchScore: 88,
      description:
        "Join our fast-growing startup to build amazing user experiences.",
      requirements: ["React", "TypeScript", "CSS", "3+ years experience"],
      benefits: ["Health Insurance", "Flexible Hours", "Learning Budget"],
    },
    {
      id: 3,
      title: "Backend Python Engineer",
      company: "DataFlow Systems",
      location: "Austin, TX",
      type: "Full-time",
      salary: "$110k - $150k",
      experience: "Mid-level",
      remote: false,
      postedDays: 5,
      matchScore: 72,
      description:
        "Build scalable backend systems for our data processing platform.",
      requirements: ["Python", "Django", "PostgreSQL", "4+ years experience"],
      benefits: ["Health Insurance", "401k", "Gym Membership"],
    },
    {
      id: 4,
      title: "DevOps Engineer",
      company: "CloudNative Co",
      location: "Seattle, WA",
      type: "Full-time",
      salary: "$130k - $170k",
      experience: "Senior",
      remote: true,
      postedDays: 3,
      matchScore: 65,
      description:
        "Manage and scale our cloud infrastructure across multiple regions.",
      requirements: ["AWS", "Kubernetes", "Terraform", "5+ years experience"],
      benefits: [
        "Health Insurance",
        "401k",
        "Remote Work",
        "Conference Budget",
      ],
    },
    {
      id: 5,
      title: "Junior Web Developer",
      company: "WebAgency Pro",
      location: "Remote",
      type: "Full-time",
      salary: "$60k - $80k",
      experience: "Junior",
      remote: true,
      postedDays: 1,
      matchScore: 58,
      description:
        "Great opportunity for a junior developer to grow their skills.",
      requirements: ["HTML", "CSS", "JavaScript", "1+ years experience"],
      benefits: ["Health Insurance", "Remote Work", "Mentorship Program"],
    },
    {
      id: 6,
      title: "Full Stack Engineer",
      company: "FinTech Solutions",
      location: "Boston, MA",
      type: "Contract",
      salary: "$90 - $120/hr",
      experience: "Mid-level",
      remote: true,
      postedDays: 4,
      matchScore: 82,
      description: "Contract position to build financial management tools.",
      requirements: ["React", "Node.js", "MongoDB", "3+ years experience"],
      benefits: ["Flexible Schedule", "Remote Work"],
    },
  ];

  const filteredJobs = useMemo(() => {
    return jobListings
      .filter((job) => {
        const matchesSearch =
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation =
          location === "" ||
          job.location.toLowerCase().includes(location.toLowerCase());
        const matchesType =
          filters.jobType === "all" || job.type === filters.jobType;
        const matchesExperience =
          filters.experience === "all" || job.experience === filters.experience;
        const matchesRemote = !filters.remote || job.remote;

        return (
          matchesSearch &&
          matchesLocation &&
          matchesType &&
          matchesExperience &&
          matchesRemote
        );
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [searchTerm, location, filters]);

  const toggleSaveJob = (jobId) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const applyToJob = (jobId) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs((prev) => [...prev, jobId]);
    }
  };

  const saveCurrentSearch = (name, emailFrequency, smsAlerts) => {
    if (!isPremium) {
      setShowPaymentModal(true);
      return;
    }

    const newSearch = {
      id: Date.now(),
      name:
        name || `${searchTerm || "All Jobs"} in ${location || "All Locations"}`,
      searchTerm,
      location,
      filters: { ...filters },
      emailFrequency,
      smsAlerts,
      createdAt: new Date().toISOString(),
      matchCount: filteredJobs.length,
    };

    setSavedSearches((prev) => [...prev, newSearch]);
    setShowSaveSearchModal(false);
  };

  const deleteSavedSearch = (searchId) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
  };

  const loadSavedSearch = (search) => {
    setSearchTerm(search.searchTerm);
    setLocation(search.location);
    setFilters(search.filters);
    setActiveTab("search");
  };

  const upgradeToPremium = (plan) => {
    setIsPremium(true);
    setShowPaymentModal(false);
  };

  const markAlertAsRead = (alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const aiInsights = [
    "Your profile matches 15 new jobs this week",
    "Companies in your area are hiring 23% more developers",
    'Add "TypeScript" to boost your match score by 12%',
    "Best time to apply: Tuesday mornings get 3x more responses",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">JobAI</h1>
            {isPremium && (
              <span className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                <Crown className="w-3 h-3" />
                <span>PRO</span>
              </span>
            )}
          </div>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab("alerts")}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.filter((a) => !a.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === "search"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
            <button
              onClick={() => setActiveTab("searches")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === "searches"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Saved Searches ({savedSearches.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === "saved"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Saved ({savedJobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === "applied"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Applied ({appliedJobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === "profile"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            {!isPremium && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 font-medium transition-all"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "search" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    AI Insights
                  </h2>
                </div>
                <div className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 bg-indigo-50 rounded-lg"
                    >
                      <Star className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Filters
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Job title, skills, company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="City, State, or Remote"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={filters.jobType}
                      onChange={(e) =>
                        setFilters({ ...filters, jobType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <select
                      value={filters.experience}
                      onChange={(e) =>
                        setFilters({ ...filters, experience: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Levels</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remote"
                      checked={filters.remote}
                      onChange={(e) =>
                        setFilters({ ...filters, remote: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="remote"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Remote Only
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <button
                    onClick={() =>
                      isPremium
                        ? setShowSaveSearchModal(true)
                        : setShowPaymentModal(true)
                    }
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Save Search & Get Alerts</span>
                    {!isPremium && (
                      <Crown className="w-4 h-4 text-yellow-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filteredJobs.length} Jobs Found
                  </h2>
                  <span className="text-sm text-gray-600">
                    Sorted by AI Match Score
                  </span>
                </div>

                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          {job.matchScore >= 80 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              {job.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-indigo-600 font-medium mb-2">
                          {job.company}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.type}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.salary}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{job.postedDays}d ago</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSaveJob(job.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          savedJobs.includes(job.id)
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Save
                          className="w-5 h-5"
                          fill={
                            savedJobs.includes(job.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </div>

                    <p className="text-gray-700 mb-4">{job.description}</p>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Key Requirements:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              userProfile.skills.some(
                                (skill) =>
                                  skill.toLowerCase() === req.toLowerCase()
                              )
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        {job.remote && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            Remote
                          </span>
                        )}
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                          {job.experience}
                        </span>
                      </div>
                      <button
                        onClick={() => applyToJob(job.id)}
                        disabled={appliedJobs.includes(job.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          appliedJobs.includes(job.id)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {appliedJobs.includes(job.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Quick Apply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearchAgent;
