import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAlertCircle,
  FiRefreshCw,
  FiThumbsUp,
  FiThumbsDown,
  FiCheck,
  FiX,
} from "react-icons/fi";
import chatAPI from "@services/chat.api.js";
import LoadingSpinner from "@components/shared/LoadingSpinner.jsx";
import { toast } from "react-hot-toast";
import { INVESTOR_OBJECTION_CATEGORIES } from "@utils/constants.js";

const InvestorObjections = () => {
  const { projectId } = useParams();
  const [objections, setObjections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedObjection, setExpandedObjection] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchObjections();
    }
  }, [projectId]);

  const fetchObjections = async () => {
    setIsLoading(true);
    try {
      const response = await chatAPI.getInvestorObjections(projectId);
      setObjections(response.data.objections || []);
    } catch (error) {
      console.error("Fetch objections error:", error);
      toast.error("Failed to load investor objections");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateObjections = async () => {
    setIsGenerating(true);
    try {
      const response = await chatAPI.generateInvestorObjections(
        projectId,
        selectedCategory
      );
      setObjections([...objections, ...response.data.objections]);
      toast.success("New objections generated!");
    } catch (error) {
      console.error("Generate objections error:", error);
      toast.error("Failed to generate objections");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerObjection = async (objectionId) => {
    try {
      const response = await chatAPI.answerInvestorObjection(
        projectId,
        objectionId
      );
      setObjections(
        objections.map((obj) =>
          obj._id === objectionId ? response.data.objection : obj
        )
      );
      setExpandedObjection(objectionId);
      toast.success("Answer generated!");
    } catch (error) {
      console.error("Answer objection error:", error);
      toast.error("Failed to generate answer");
    }
  };

  const handleRateAnswer = async (objectionId, rating) => {
    try {
      await chatAPI.rateInvestorAnswer(projectId, objectionId, rating);
      setObjections(
        objections.map((obj) =>
          obj._id === objectionId ? { ...obj, rating } : obj
        )
      );
      toast.success("Rating submitted!");
    } catch (error) {
      console.error("Rate answer error:", error);
      toast.error("Failed to submit rating");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Market Size": "from-purple-500 to-pink-500",
      Competition: "from-blue-500 to-cyan-500",
      Team: "from-green-500 to-teal-500",
      Traction: "from-yellow-500 to-orange-500",
      "Business Model": "from-red-500 to-pink-500",
      Technology: "from-indigo-500 to-purple-500",
      Scalability: "from-teal-500 to-green-500",
      Funding: "from-orange-500 to-red-500",
      Risk: "from-pink-500 to-rose-500",
      "Exit Strategy": "from-cyan-500 to-blue-500",
    };
    return colors[category] || "from-gray-500 to-gray-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading objections..." />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <FiAlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Investor Objections Practice
              </h1>
              <p className="text-purple-100">
                Practice answering tough questions investors might ask. Get
                AI-generated responses and improve your pitch.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generate New Objections
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === null
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {INVESTOR_OBJECTION_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateObjections}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FiRefreshCw
              className={`h-5 w-5 ${isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating ? "Generating..." : "Generate Objections"}
          </button>
        </div>

        <div className="space-y-4">
          {objections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <FiAlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No objections yet
              </h3>
              <p className="text-gray-600">
                Generate some investor objections to practice your responses
              </p>
            </div>
          ) : (
            objections.map((objection, index) => (
              <motion.div
                key={objection._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 bg-gradient-to-r ${getCategoryColor(
                            objection.category
                          )} text-white text-xs font-semibold rounded-lg`}
                        >
                          {objection.category}
                        </span>
                        {objection.difficulty && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                            {objection.difficulty}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {objection.question}
                      </h4>
                    </div>
                  </div>

                  {objection.context && (
                    <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                      <strong>Context:</strong> {objection.context}
                    </p>
                  )}

                  {!objection.suggestedAnswer ? (
                    <button
                      onClick={() => handleAnswerObjection(objection._id)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FiCheck className="h-5 w-5" />
                      Generate Answer
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`transition-all duration-300 ${
                          expandedObjection === objection._id
                            ? "max-h-none"
                            : "max-h-0 overflow-hidden"
                        }`}
                      >
                        <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl">
                          <h5 className="text-sm font-semibold text-gray-900 mb-2">
                            Suggested Answer:
                          </h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {objection.suggestedAnswer}
                          </p>
                        </div>

                        {objection.tips && objection.tips.length > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">
                              Tips:
                            </h5>
                            <ul className="space-y-1">
                              {objection.tips.map((tip, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-gray-700 flex items-start gap-2"
                                >
                                  <span className="text-blue-600 mt-0.5">
                                    •
                                  </span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            setExpandedObjection(
                              expandedObjection === objection._id
                                ? null
                                : objection._id
                            )
                          }
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {expandedObjection === objection._id
                            ? "Hide Answer"
                            : "Show Answer"}
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Rate this answer:
                          </span>
                          <button
                            onClick={() =>
                              handleRateAnswer(objection._id, "helpful")
                            }
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              objection.rating === "helpful"
                                ? "bg-green-100 text-green-600"
                                : "hover:bg-gray-100 text-gray-400"
                            }`}
                          >
                            <FiThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleRateAnswer(objection._id, "not_helpful")
                            }
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              objection.rating === "not_helpful"
                                ? "bg-red-100 text-red-600"
                                : "hover:bg-gray-100 text-gray-400"
                            }`}
                          >
                            <FiThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorObjections;
