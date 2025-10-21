import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Card from '@components/common/Card';
import { useProjectContext } from '@contexts/projectcontext';
import { toast } from 'react-hot-toast';

const CreateProject = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectContext();

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    industry: '',
    stage: 'idea',
    status: 'active',
    targetMarket: {
      primary: '',
      secondary: [],
      geography: []
    },
    problemStatement: '',
    solution: '',
    uniqueValueProposition: '',
    tags: []
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Project fundamentals' },
    { number: 2, title: 'Problem & Solution', description: 'What you\'re solving' },
    { number: 3, title: 'Market', description: 'Target audience' },
    { number: 4, title: 'Review', description: 'Final check' }
  ];

  // Validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Project name is required';
        } else if (value.trim().length < 3) {
          newErrors.name = 'Project name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          newErrors.name = 'Project name cannot exceed 100 characters';
        } else {
          delete newErrors.name;
        }
        break;

      case 'description':
        if (value && value.length > 2000) {
          newErrors.description = 'Description cannot exceed 2000 characters';
        } else {
          delete newErrors.description;
        }
        break;

      case 'tagline':
        if (value && value.length > 200) {
          newErrors.tagline = 'Tagline cannot exceed 200 characters';
        } else {
          delete newErrors.tagline;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        stepErrors.name = 'Project name is required';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const project = await createProject(formData);
      toast.success('Project created successfully! 🎉');
      navigate(`/projects/${project._id}`);
    } catch (error) {
      console.error('Create project error:', error);
      // Error is already handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>

            <Input
              label="Project Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              required
              placeholder="Enter your project name"
            />

            <Input
              label="Tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.tagline}
              touched={touched.tagline}
              placeholder="A short, catchy description"
              helperText="Max 200 characters"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                placeholder="Describe your project..."
              />
              <p className="mt-2 text-sm text-gray-500">
                {formData.description.length}/2000 characters
              </p>
            </div>

            <Input
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g., FinTech, HealthTech, EdTech"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stage
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <option value="idea">Idea</option>
                  <option value="validation">Validation</option>
                  <option value="mvp">MVP</option>
                  <option value="growth">Growth</option>
                  <option value="scale">Scale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Problem & Solution</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Problem Statement
              </label>
              <textarea
                name="problemStatement"
                value={formData.problemStatement}
                onChange={handleChange}
                rows={4}
                className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                placeholder="What problem are you solving?"
              />
              <p className="mt-2 text-sm text-gray-500">
                Describe the pain point your target customers face
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solution
              </label>
              <textarea
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                rows={4}
                className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                placeholder="How does your solution solve the problem?"
              />
              <p className="mt-2 text-sm text-gray-500">
                Explain how your product/service addresses the problem
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unique Value Proposition
              </label>
              <textarea
                name="uniqueValueProposition"
                value={formData.uniqueValueProposition}
                onChange={handleChange}
                rows={3}
                className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                placeholder="What makes you unique?"
              />
              <p className="mt-2 text-sm text-gray-500">
                Why would customers choose you over competitors?
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Target Market</h3>

            <Input
              label="Primary Target Market"
              name="targetMarket.primary"
              value={formData.targetMarket.primary}
              onChange={handleChange}
              placeholder="e.g., Small businesses, Students, Enterprises"
              helperText="Who is your primary customer?"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Be specific about your target market. The more focused
                you are, the easier it will be to market your product effectively.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Review Your Project</h3>

            <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
              <h4 className="font-bold text-gray-900 mb-4">Basic Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Project Name</p>
                  <p className="font-semibold text-gray-900">{formData.name || 'Not provided'}</p>
                </div>
                {formData.tagline && (
                  <div>
                    <p className="text-sm text-gray-600">Tagline</p>
                    <p className="font-semibold text-gray-900">{formData.tagline}</p>
                  </div>
                )}
                {formData.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-900">{formData.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-semibold text-gray-900">{formData.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stage</p>
                    <p className="font-semibold text-gray-900 capitalize">{formData.stage}</p>
                  </div>
                </div>
              </div>
            </Card>

            {(formData.problemStatement || formData.solution) && (
              <Card className="bg-gradient-to-br from-green-50 to-teal-50">
                <h4 className="font-bold text-gray-900 mb-4">Problem & Solution</h4>
                <div className="space-y-3">
                  {formData.problemStatement && (
                    <div>
                      <p className="text-sm text-gray-600">Problem</p>
                      <p className="text-gray-900">{formData.problemStatement}</p>
                    </div>
                  )}
                  {formData.solution && (
                    <div>
                      <p className="text-sm text-gray-600">Solution</p>
                      <p className="text-gray-900">{formData.solution}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {formData.targetMarket.primary && (
              <Card className="bg-gradient-to-br from-orange-50 to-pink-50">
                <h4 className="font-bold text-gray-900 mb-4">Target Market</h4>
                <div>
                  <p className="text-sm text-gray-600">Primary Market</p>
                  <p className="font-semibold text-gray-900">{formData.targetMarket.primary}</p>
                </div>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={FiArrowLeft}
          onClick={() => navigate('/projects')}
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-1">Let's bring your startup idea to life</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.number}
                </div>
                <div className="text-center mt-2">
                  <p
                    className={`text-sm font-semibold ${
                      currentStep >= step.number ? 'text-purple-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                    currentStep > step.number ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              icon={FiX}
              onClick={() => navigate('/projects')}
            >
              Cancel
            </Button>

            {currentStep < steps.length ? (
              <Button variant="primary" onClick={handleNext}>
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={FiSave}
                onClick={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
              >
                Create Project
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateProject;