import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ChevronRight, ChevronLeft, Lock, XCircle } from 'lucide-react'
import { useConfigReadiness } from '@/hooks/use-config-readiness'
import { SectorsStep } from './wizard-steps/SectorsStep'
import { FunctionalAreasStep } from './wizard-steps/FunctionalAreasStep'
import { VehicleTypesStep } from './wizard-steps/VehicleTypesStep'
import { AccessZonesStep } from './wizard-steps/AccessZonesStep'
import { AccessTypesStep } from './wizard-steps/AccessTypesStep'
import { ValidityStep } from './wizard-steps/ValidityStep'
import { ImportanceStep } from './wizard-steps/ImportanceStep'

const WIZARD_STEPS = [
  {
    id: 'sectors',
    label: 'Sectors',
    component: SectorsStep,
    dependencies: [],
    required: true,
  },
  {
    id: 'functional-areas',
    label: 'Functional Areas',
    component: FunctionalAreasStep,
    dependencies: [],
    required: true,
  },
  {
    id: 'vehicle-types',
    label: 'Vehicle Types',
    component: VehicleTypesStep,
    dependencies: [],
    required: true,
  },
  {
    id: 'access-zones',
    label: 'Access Zones',
    component: AccessZonesStep,
    dependencies: [],
    required: true,
  },
  {
    id: 'access-types',
    label: 'Access Types',
    component: AccessTypesStep,
    dependencies: [],
    required: true,
  },
  {
    id: 'validity',
    label: 'Validity',
    component: ValidityStep,
    dependencies: [],
    required: true,
  },
  {
    id: 'importance',
    label: 'Importance',
    component: ImportanceStep,
    dependencies: [],
    required: false,
  },
]

/**
 * Config Setup Wizard
 * Multi-step wizard with dependency-based step locking
 * @param {string} eventId - Event ID
 * @param {string} [initialStep] - Initial step ID to show (overrides URL param)
 */
export function ConfigSetupWizard({ eventId, initialStep: initialStepProp }) {
  const [searchParams] = useSearchParams()
  const initialStepParam = initialStepProp || searchParams?.get('step')
  
  const { readiness, checklistItems, loading: readinessLoading, refetch: refetchReadiness } = useConfigReadiness(eventId)
  
  // Find initial step from prop, URL, or readiness
  const initialStep = useMemo(() => {
    if (initialStepParam) {
      const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === initialStepParam)
      if (stepIndex >= 0) return stepIndex
    }
    // Find first incomplete step
    if (!readinessLoading && checklistItems) {
      const firstIncomplete = checklistItems.findIndex((item) => !item.done)
      if (firstIncomplete >= 0 && firstIncomplete < WIZARD_STEPS.length) {
        return firstIncomplete
      }
    }
    return 0
  }, [initialStepParam, checklistItems, readinessLoading])

  const [currentStep, setCurrentStep] = useState(() => initialStep)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const initialStepRef = useRef(initialStep)

  // Update current step when initial step changes (from URL or readiness)
  useEffect(() => {
    if (initialStep !== initialStepRef.current) {
      initialStepRef.current = initialStep
      setCurrentStep(initialStep)
    }
  }, [initialStep])

  // Update completed steps based on readiness
  const prevChecklistItemsRef = useRef(null)
  
  useEffect(() => {
    if (!readiness) {
      setCompletedSteps(new Set())
      return
    }
    
    if (!checklistItems || checklistItems.length === 0) {
      prevChecklistItemsRef.current = checklistItems
      setCompletedSteps(new Set())
      return
    }
    
    // Check if checklistItems actually changed
    const prevItems = prevChecklistItemsRef.current
    if (prevItems && prevItems.length === checklistItems.length) {
      const itemsChanged = checklistItems.some((item, idx) => {
        const prevItem = prevItems[idx]
        return !prevItem || prevItem.done !== item.done
      })
      if (!itemsChanged) {
        return
      }
    }
    
    prevChecklistItemsRef.current = checklistItems
    
    const completed = new Set()
    checklistItems.forEach((item, idx) => {
      if (item.done && idx < WIZARD_STEPS.length) {
        completed.add(WIZARD_STEPS[idx].id)
      }
    })
    
    setCompletedSteps(completed)
  }, [readiness, checklistItems])

  // Check if step is unlocked (all dependencies completed)
  const isStepUnlocked = (stepIndex) => {
    const step = WIZARD_STEPS[stepIndex]
    if (!step.dependencies || step.dependencies.length === 0) return true

    return step.dependencies.every((depId) => {
      const depIndex = WIZARD_STEPS.findIndex((s) => s.id === depId)
      return depIndex >= 0 && completedSteps.has(depId)
    })
  }

  // Check if step is completed
  const isStepCompleted = (stepIndex) => {
    return completedSteps.has(WIZARD_STEPS[stepIndex].id)
  }

  const handleNext = () => {
    // Find next unlocked step
    for (let i = currentStep + 1; i < WIZARD_STEPS.length; i++) {
      if (isStepUnlocked(i)) {
        setCurrentStep(i)
        return
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex) => {
    if (isStepUnlocked(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }

  const refetchReadinessRef = useRef(refetchReadiness)
  useEffect(() => {
    refetchReadinessRef.current = refetchReadiness
  }, [refetchReadiness])

  const handleStepComplete = (stepId) => {
    setCompletedSteps(new Set([...completedSteps, stepId]))
    // Refetch readiness to update checklist (debounced)
    setTimeout(() => {
      refetchReadinessRef.current()
    }, 100)
  }

  const handleDataChange = useCallback(() => {
    // Debounce refetch to avoid loops
    setTimeout(() => {
      refetchReadinessRef.current()
    }, 100)
  }, [])

  const CurrentStepComponent = WIZARD_STEPS[currentStep].component
  const isCurrentStepUnlocked = isStepUnlocked(currentStep)

  return (
    <div className="space-y-6">
      {/* Top - Horizontal Step Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setup Steps</CardTitle>
          <CardDescription>Complete each step to configure your event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 lg:gap-4">
            {WIZARD_STEPS.map((step, idx) => {
              const isActive = idx === currentStep
              const isCompleted = isStepCompleted(idx)
              const isUnlocked = isStepUnlocked(idx)
              const isPast = idx < currentStep

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                    !isUnlocked
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : isActive
                      ? 'bg-blue-50 border-2 border-blue-500 cursor-pointer'
                      : isPast || isCompleted
                      ? 'bg-gray-50 cursor-pointer hover:bg-gray-100'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                  onClick={() => isUnlocked && handleStepClick(idx)}
                >
                  {/* Step Number/Icon */}
                  <div className="flex-shrink-0">
                    {!isUnlocked ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                          isActive
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  {/* Step Label */}
                  <div className="flex flex-col min-w-0">
                    <div
                      className={`text-sm font-medium whitespace-nowrap ${
                        !isUnlocked
                          ? 'text-gray-400'
                          : isActive
                          ? 'text-blue-900 font-semibold'
                          : 'text-gray-700'
                      }`}
                    >
                      {step.label}
                    </div>
                    {!isUnlocked && (
                      <div className="text-xs text-gray-400">
                        Locked
                      </div>
                    )}
                    {step.required === false && (
                      <div className="text-xs text-gray-500">
                        Optional
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom - Content Panel */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Step {currentStep + 1} of {WIZARD_STEPS.length}:{' '}
                  {WIZARD_STEPS[currentStep].label}
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentStep === 0 && 'Define organizational sectors for this event'}
                  {currentStep === 1 && 'Define functional areas for this event'}
                  {currentStep === 2 && 'Configure vehicle types (global defaults and event-specific)'}
                  {currentStep === 3 && 'Define venue access zones for this event'}
                  {currentStep === 4 && 'Configure access types (global defaults and event-specific)'}
                  {currentStep === 5 && 'Define validity periods for this event'}
                  {currentStep === 6 && 'Review static importance levels (read-only)'}
                </CardDescription>
              </div>
              {isStepCompleted(currentStep) && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isCurrentStepUnlocked ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Step Locked
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md">
                      Complete the required previous steps to unlock this step:
                    </p>
                    <ul className="mt-3 text-sm text-gray-600 space-y-1">
                      {WIZARD_STEPS[currentStep].dependencies.map((depId) => {
                        const depStep = WIZARD_STEPS.find((s) => s.id === depId)
                        return (
                          <li key={depId} className="flex items-center justify-center gap-2">
                            {isStepCompleted(
                              WIZARD_STEPS.findIndex((s) => s.id === depId)
                            ) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            {depStep?.label}
                          </li>
                        )
                      })}
                    </ul>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        const firstIncompleteDep = WIZARD_STEPS[currentStep].dependencies.find(
                          (depId) =>
                            !isStepCompleted(WIZARD_STEPS.findIndex((s) => s.id === depId))
                        )
                        if (firstIncompleteDep) {
                          const depIndex = WIZARD_STEPS.findIndex((s) => s.id === firstIncompleteDep)
                          if (depIndex >= 0) setCurrentStep(depIndex)
                        }
                      }}
                    >
                      Go to Required Step
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="min-h-[400px]">
                  <CurrentStepComponent
                    eventId={eventId}
                    onComplete={() => handleStepComplete(WIZARD_STEPS[currentStep].id)}
                    onDataChange={handleDataChange}
                  />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      Step {currentStep + 1} of {WIZARD_STEPS.length}
                    </div>
                    
                    {!WIZARD_STEPS[currentStep].required && (
                      <Button
                        variant="outline"
                        onClick={handleNext}
                        disabled={currentStep === WIZARD_STEPS.length - 1}
                        className="text-blue-600 border-blue-300"
                      >
                        Skip (Optional)
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={
                      currentStep === WIZARD_STEPS.length - 1 ||
                      !isStepUnlocked(currentStep + 1)
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
