import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface Resume {
  id: string;
  filename: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  matchScore?: number;
  uploadedAt: string;
  email: string;
  phone: string;
  skills: string[];
}

interface InterviewQuestion {
  category: string;
  question: string;
  whatToListenFor: string;
  candidateTip: string;
}

export default function RecruiterDashboard() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [username, setUsername] = useState('');
  const [expandedResumeId, setExpandedResumeId] = useState<string | null>(null);
  const [questionsByResume, setQuestionsByResume] = useState<Record<string, InterviewQuestion[]>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('https://ai-resume-analyzer-job-match-scoring.onrender.com/api/auth/check', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!data.authenticated || data.role !== 'recruiter') {
        navigate('/login');
        return;
      }
      
      setUsername(data.username);
      fetchResumes();
    } catch (error) {
      navigate('/login');
    }
  };

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://ai-resume-analyzer-job-match-scoring.onrender.com/api/recruiter/resumes', {
        credentials: 'include'
      });
      const data = await res.json();
      setResumes(data);
      setIsRanked(false);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleRank = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter job description');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://ai-resume-analyzer-job-match-scoring.onrender.com/api/recruiter/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobDescription })
      });
      const data = await res.json();
      setResumes(data.rankedResumes);
      setIsRanked(true);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('https://ai-resume-analyzer-job-match-scoring.onrender.com/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    localStorage.clear();
    navigate('/login');
  };

  const downloadResume = (id: string) => {
    window.open(`https://ai-resume-analyzer-job-match-scoring.onrender.com/api/resume/${id}/download`, '_blank');
  };

  const handleToggleQuestions = async (resume: Resume) => {
    // Already expanded -> collapse
    if (expandedResumeId === resume.id) {
      setExpandedResumeId(null);
      return;
    }

    setExpandedResumeId(resume.id);

    // Already fetched/generated in this session -> just show them
    if (questionsByResume[resume.id]) {
      return;
    }

    // Try loading previously generated questions first (avoids paying for AI twice)
    try {
      const res = await fetch(`https://ai-resume-analyzer-job-match-scoring.onrender.com/api/interview-questions/${resume.id}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setQuestionsByResume(prev => ({ ...prev, [resume.id]: data.questions }));
        return;
      }
    } catch (error) {
      // fall through to generation
    }

    await handleGenerateQuestions(resume);
  };

  const handleGenerateQuestions = async (resume: Resume) => {
    setGeneratingFor(resume.id);
    setQuestionError(prev => ({ ...prev, [resume.id]: '' }));
    try {
      const res = await fetch(`https://ai-resume-analyzer-job-match-scoring.onrender.com/api/recruiter/interview-questions/${resume.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobTitle: resume.jobTitle, jobDescription })
      });
      const data = await res.json();

      if (!res.ok) {
        setQuestionError(prev => ({ ...prev, [resume.id]: data.error || 'Failed to generate questions' }));
        return;
      }

      setQuestionsByResume(prev => ({ ...prev, [resume.id]: data.questions }));
      setExpandedResumeId(resume.id);
    } catch (error) {
      setQuestionError(prev => ({ ...prev, [resume.id]: 'Network error while generating questions' }));
    }
    setGeneratingFor(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AI Resume Analyzer
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, <strong>{username}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 Rank Resumes by Job Description
          </h2>
          <p className="text-gray-600 mb-4">
            Enter a job description to rank all resumes using AI-powered matching algorithm
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Example: We are looking for a Full Stack Developer with 3+ years of experience in React, Node.js, and MongoDB. Should have strong problem-solving skills..."
            className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:border-purple-500 focus:outline-none mb-4"
          />
          <div className="flex gap-4">
            <button
              onClick={handleRank}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Ranking...' : '🎯 Rank Resumes'}
            </button>
            <button
              onClick={fetchResumes}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50"
            >
              🔄 Refresh List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isRanked ? `📊 Ranked Resumes (${resumes.length})` : `📁 All Resumes (${resumes.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No resumes uploaded yet</p>
              <p className="text-gray-400 text-sm mt-2">Candidates need to upload their resumes first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume, index) => (
                <div
                  key={resume.id}
                  className={`border-2 rounded-xl p-6 transition hover:shadow-lg ${
                    isRanked && index === 0 ? 'border-yellow-400 bg-yellow-50' : 
                    isRanked && index === 1 ? 'border-gray-300 bg-gray-50' :
                    isRanked && index === 2 ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    {isRanked && (
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-purple-600'
                        }`}
                      >
                        #{index + 1}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {resume.candidateName}
                          </h3>
                          <p className="text-gray-600 text-sm">{resume.filename}</p>
                        </div>
                        {isRanked && (
                          <div className="text-right">
                            <div className="text-3xl font-bold text-purple-600">
                              {resume.matchScore}%
                            </div>
                            <div className="text-sm text-gray-500">Match Score</div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">💼 Job Title:</span>
                          <span className="text-gray-600">{resume.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">📧 Email:</span>
                          <span className="text-gray-600">{resume.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">📞 Phone:</span>
                          <span className="text-gray-600">{resume.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">📅 Uploaded:</span>
                          <span className="text-gray-600">
                            {new Date(resume.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {resume.skills.length > 0 && (
                        <div className="mb-4">
                          <span className="font-semibold text-sm text-gray-700">🛠️ Skills:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {resume.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold uppercase"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => downloadResume(resume.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold inline-flex items-center gap-2"
                        >
                          <span>📥</span>
                          Download Resume
                        </button>
                        <button
                          onClick={() => handleToggleQuestions(resume)}
                          disabled={generatingFor === resume.id}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                        >
                          <span>🎤</span>
                          {generatingFor === resume.id
                            ? 'Generating...'
                            : expandedResumeId === resume.id
                            ? 'Hide Interview Questions'
                            : 'Interview Questions'}
                        </button>
                        {questionsByResume[resume.id] && (
                          <button
                            onClick={() => handleGenerateQuestions(resume)}
                            disabled={generatingFor === resume.id}
                            className="px-4 py-2 bg-white border-2 border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 transition text-sm font-semibold disabled:opacity-50"
                          >
                            🔄 Regenerate
                          </button>
                        )}
                      </div>

                      {questionError[resume.id] && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                          {questionError[resume.id]}
                        </p>
                      )}

                      {expandedResumeId === resume.id && questionsByResume[resume.id] && (
                        <div className="mt-4 space-y-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
                          <h4 className="font-bold text-emerald-800 text-sm uppercase tracking-wide">
                            🎤 AI-Generated Interview Questions ({questionsByResume[resume.id].length})
                          </h4>
                          <p className="text-xs text-emerald-700 -mt-2">
                            The candidate sees the same questions with prep tips instead of evaluation notes.
                          </p>
                          {questionsByResume[resume.id].map((q, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 border border-emerald-100">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase">
                                  {q.category}
                                </span>
                              </div>
                              <p className="font-semibold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-700">👂 What to listen for: </span>
                                {q.whatToListenFor}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}