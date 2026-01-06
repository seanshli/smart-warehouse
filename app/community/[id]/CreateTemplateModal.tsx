'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, XMarkIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface WorkflowType {
  id: string
  name: string
  description?: string
  category: string
  isActive: boolean
}

interface WorkingGroup {
  id: string
  name: string
  type: string
  members?: Array<{
    id: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
}

interface Step {
  name: string
  description: string
  taskDescription: string
  estimatedMinutes: number | null
  workingGroupId: string
  assignedToId: string
  isRequired: boolean
  canSkip: boolean
}

function CreateTemplateModal({
  communityId,
  buildingId,
  workflowTypes,
  onClose,
  onCreate,
}: {
  communityId: string
  buildingId?: string
  workflowTypes: WorkflowType[]
  onClose: () => void
  onCreate: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workflowTypeId, setWorkflowTypeId] = useState('')
  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [steps, setSteps] = useState<Step[]>([
    {
      name: '',
      description: '',
      taskDescription: '',
      estimatedMinutes: null,
      workingGroupId: '',
      assignedToId: '',
      isRequired: true,
      canSkip: false,
    },
  ])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchWorkingGroups()
  }, [communityId, buildingId])

  const fetchWorkingGroups = async () => {
    try {
      setLoadingGroups(true)
      const url = buildingId
        ? `/api/building/${buildingId}/working-groups`
        : `/api/community/${communityId}/working-groups`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const groups = data.workingGroups || []
        
        // Fetch members for each group
        const groupsWithMembers = await Promise.all(
          groups.map(async (group: WorkingGroup) => {
            const membersUrl = buildingId
              ? `/api/building/${buildingId}/working-groups/${group.id}/members`
              : `/api/community/${communityId}/working-groups/${group.id}/members`
            
            try {
              const membersRes = await fetch(membersUrl)
              if (membersRes.ok) {
                const membersData = await membersRes.json()
                return { ...group, members: membersData.members || [] }
              }
            } catch (error) {
              console.error(`Error fetching members for group ${group.id}:`, error)
            }
            return { ...group, members: [] }
          })
        )
        
        setWorkingGroups(groupsWithMembers)
      }
    } catch (error) {
      console.error('Error fetching working groups:', error)
      toast.error('Failed to load working groups')
    } finally {
      setLoadingGroups(false)
    }
  }

  const addStep = () => {
    setSteps([
      ...steps,
      {
        name: '',
        description: '',
        taskDescription: '',
        estimatedMinutes: null,
        workingGroupId: '',
        assignedToId: '',
        isRequired: true,
        canSkip: false,
      },
    ])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    } else {
      toast.error('At least one step is required')
    }
  }

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    
    // If working group changed, clear assigned person
    if (field === 'workingGroupId') {
      newSteps[index].assignedToId = ''
    }
    
    setSteps(newSteps)
  }

  const getAvailableMembers = (workingGroupId: string) => {
    const group = workingGroups.find(g => g.id === workingGroupId)
    return group?.members || []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error('Name is required')
      return
    }

    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step.name.trim()) {
        toast.error(`Step ${i + 1}: Name is required`)
        return
      }
      if (!step.workingGroupId) {
        toast.error(`Step ${i + 1}: Working group is required`)
        return
      }
      if (step.estimatedMinutes !== null && step.estimatedMinutes <= 0) {
        toast.error(`Step ${i + 1}: Estimated time must be greater than 0`)
        return
      }
    }

    setCreating(true)
    try {
      const response = await fetch('/api/workflow-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowTypeId: workflowTypeId || undefined,
          name,
          description,
          isDefault: false,
          steps: steps.map((step, index) => ({
            stepOrder: index + 1,
            name: step.name,
            description: step.description || undefined,
            taskDescription: step.taskDescription || undefined,
            estimatedMinutes: step.estimatedMinutes || undefined,
            workingGroupId: step.workingGroupId,
            assignedToId: step.assignedToId || undefined,
            isRequired: step.isRequired,
            canSkip: step.canSkip,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create template')
      }

      toast.success('Template created successfully')
      onCreate()
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create template')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Create Workflow Template</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Template Name *
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
                Workflow Type (Optional)
              </label>
              {workflowTypes.length === 0 ? (
                <div className="w-full border border-gray-300 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600">
                  No workflow types available. Template can be created without a type.
                </div>
              ) : (
                <select
                  value={workflowTypeId}
                  onChange={(e) => setWorkflowTypeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">None (Optional)</option>
                  {workflowTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
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

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Workflow Steps</h4>
                <button
                  type="button"
                  onClick={addStep}
                  className="flex items-center px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Step
                </button>
              </div>

              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-medium">
                          {index + 1}
                        </span>
                        <h5 className="text-sm font-medium text-gray-900">
                          Step {index + 1}
                          {index === steps.length - 1 && (
                            <span className="ml-2 text-xs text-gray-500">(Last Step)</span>
                          )}
                        </h5>
                      </div>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {index < steps.length - 1 && (
                      <div className="mb-4 flex items-center justify-center">
                        <ArrowDownIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Step Name *
                        </label>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Description
                        </label>
                        <textarea
                          value={step.taskDescription}
                          onChange={(e) => updateStep(index, 'taskDescription', e.target.value)}
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="What needs to be done in this step..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Time (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={step.estimatedMinutes || ''}
                          onChange={(e) => updateStep(index, 'estimatedMinutes', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Working Group *
                        </label>
                        <select
                          value={step.workingGroupId}
                          onChange={(e) => updateStep(index, 'workingGroupId', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        >
                          <option value="">Select working group...</option>
                          {workingGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} ({group.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign To Person
                        </label>
                        <select
                          value={step.assignedToId}
                          onChange={(e) => updateStep(index, 'assignedToId', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          disabled={!step.workingGroupId}
                        >
                          <option value="">Select person (optional)...</option>
                          {getAvailableMembers(step.workingGroupId).map((member) => (
                            <option key={member.user.id} value={member.user.id}>
                              {member.user.name || member.user.email}
                            </option>
                          ))}
                        </select>
                        {!step.workingGroupId && (
                          <p className="mt-1 text-xs text-gray-500">Select a working group first</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={step.isRequired}
                            onChange={(e) => updateStep(index, 'isRequired', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={step.canSkip}
                            onChange={(e) => updateStep(index, 'canSkip', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Can Skip</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
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
              {creating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTemplateModal

