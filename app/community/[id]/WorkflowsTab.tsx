'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface WorkflowType {
  id: string
  name: string
  description?: string
  category: string
  isActive: boolean
}

interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  workflowType: WorkflowType
  steps: WorkflowTemplateStep[]
}

interface WorkflowTemplateStep {
  id: string
  stepOrder: number
  name: string
  description?: string
  taskDescription?: string
  estimatedMinutes?: number
  workingGroup?: {
    id: string
    name: string
  }
}

interface Workflow {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  workflowType: WorkflowType
  createdBy: {
    id: string
    name: string
    email: string
  }
  steps: WorkflowStep[]
  _count: {
    steps: number
    tasks: number
  }
}

interface WorkflowStep {
  id: string
  stepOrder: number
  name: string
  status: string
  startedAt?: string
  completedAt?: string
  waitTimeMinutes?: number
  durationMinutes?: number
}

export default function WorkflowsTab({ communityId }: { communityId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [workflowTypes, setWorkflowTypes] = useState<WorkflowType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [activeView, setActiveView] = useState<'workflows' | 'templates' | 'types'>('workflows')

  useEffect(() => {
    fetchData()
  }, [communityId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const workflowsUrl = buildingId 
        ? `/api/workflows?buildingId=${buildingId}`
        : `/api/workflows?communityId=${communityId}`
      
      const [workflowsRes, templatesRes, typesRes] = await Promise.all([
        fetch(workflowsUrl),
        fetch('/api/workflow-templates'),
        fetch('/api/workflow-types'),
      ])

      if (workflowsRes.ok) {
        const data = await workflowsRes.json()
        setWorkflows(data.workflows || [])
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }

      if (typesRes.ok) {
        const data = await typesRes.json()
        setWorkflowTypes(data.workflowTypes || [])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
      toast.error('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkflow = async (workflowData: any) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workflowData,
          communityId: buildingId ? undefined : communityId,
          buildingId: buildingId || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create workflow')
      }

      toast.success('Workflow created successfully')
      setShowCreateModal(false)
      fetchData()
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create workflow')
    }
  }

  const handleStartWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start workflow')
      }

      toast.success('Workflow started')
      fetchData()
    } catch (error) {
      console.error('Error starting workflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start workflow')
    }
  }

  const handleCompleteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete workflow')
      }

      toast.success('Workflow completed')
      fetchData()
    } catch (error) {
      console.error('Error completing workflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to complete workflow')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading workflows...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('workflows')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeView === 'workflows'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Workflows
          </button>
          <button
            onClick={() => setActiveView('templates')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeView === 'templates'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveView('types')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeView === 'types'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Types
          </button>
        </div>
        {activeView === 'workflows' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 inline-block mr-2" />
            Create Workflow
          </button>
        )}
        {activeView === 'templates' && (
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 inline-block mr-2" />
            Create Template
          </button>
        )}
      </div>

      {activeView === 'workflows' && (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No workflows found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
              >
                Create your first workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        workflow.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : workflow.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Type: {workflow.workflowType.name}</span>
                    <span>{workflow._count.steps} steps</span>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    {workflow.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartWorkflow(workflow.id)
                        }}
                        className="flex-1 px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
                      >
                        Start
                      </button>
                    )}
                    {workflow.status === 'IN_PROGRESS' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompleteWorkflow(workflow.id)
                        }}
                        className="flex-1 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No templates found</p>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
              >
                Create your first template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    Type: {template.workflowType.name} • {template.steps.length} steps
                  </div>
                  <div className="space-y-1">
                    {template.steps.map((step) => (
                      <div key={step.id} className="text-xs text-gray-600 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          {step.stepOrder}
                        </span>
                        <span>{step.name}</span>
                        {step.estimatedMinutes && (
                          <span className="ml-auto text-gray-400">
                            <ClockIcon className="h-3 w-3 inline mr-1" />
                            {step.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'types' && (
        <div className="space-y-4">
          {workflowTypes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No workflow types found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTypes.map((type) => (
                <div
                  key={type.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Category: {type.category}</span>
                    {type.isActive ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          communityId={communityId}
          templates={templates}
          workflowTypes={workflowTypes}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkflow}
        />
      )}

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <WorkflowDetailModal
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  )
}

function CreateWorkflowModal({
  communityId,
  templates,
  workflowTypes,
  onClose,
  onCreate,
}: {
  communityId: string
  templates: WorkflowTemplate[]
  workflowTypes: WorkflowType[]
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workflowTypeId, setWorkflowTypeId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !workflowTypeId) {
      toast.error('Name and workflow type are required')
      return
    }

    setCreating(true)
    try {
      await onCreate({
        name,
        description,
        workflowTypeId,
        templateId: templateId || undefined,
        priority,
        communityId,
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Create Workflow</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Workflow Type *
            </label>
            <select
              value={workflowTypeId}
              onChange={(e) => setWorkflowTypeId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select type...</option>
              {workflowTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Template (Optional)
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">None - Create from scratch</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WorkflowDetailModal({
  workflow,
  onClose,
  onUpdate,
}: {
  workflow: Workflow
  onClose: () => void
  onUpdate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [workflowDetail, setWorkflowDetail] = useState<Workflow | null>(null)

  useEffect(() => {
    fetchWorkflowDetail()
  }, [workflow.id])

  const fetchWorkflowDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workflows/${workflow.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowDetail(data.workflow)
      }
    } catch (error) {
      console.error('Error fetching workflow detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartStep = async (stepId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/steps/${stepId}/start`, {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Step started')
        fetchWorkflowDetail()
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start step')
      }
    } catch (error) {
      console.error('Error starting step:', error)
      toast.error('Failed to start step')
    }
  }

  const handleCompleteStep = async (stepId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/steps/${stepId}/complete`, {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Step completed')
        fetchWorkflowDetail()
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to complete step')
      }
    } catch (error) {
      console.error('Error completing step:', error)
      toast.error('Failed to complete step')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workflow details...</p>
          </div>
        </div>
      </div>
    )
  }

  const displayWorkflow = workflowDetail || workflow

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{displayWorkflow.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Status: {displayWorkflow.status} • Priority: {displayWorkflow.priority}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {displayWorkflow.description && (
            <p className="text-sm text-gray-600 mb-4">{displayWorkflow.description}</p>
          )}
          <div className="space-y-3">
            {displayWorkflow.steps.map((step) => (
              <div
                key={step.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold mr-3">
                      {step.stepOrder}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{step.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          step.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : step.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {step.status === 'PENDING' && (
                      <button
                        onClick={() => handleStartStep(step.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
                      >
                        Start
                      </button>
                    )}
                    {step.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteStep(step.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
                {step.waitTimeMinutes !== undefined && (
                  <div className="text-xs text-gray-500 mt-2">
                    Wait time: {step.waitTimeMinutes} minutes
                  </div>
                )}
                {step.durationMinutes !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    Duration: {step.durationMinutes} minutes
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

