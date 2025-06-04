'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Circle,
  Coffee,
  Mic,
  User,
  Utensils
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type OrderFlowStep, useOrderFlow } from '@/lib/state/order-flow-context'

interface OrderProcessingSectionProps {
  className?: string
}

const STEP_CONFIG = {
  tableSelect: { 
    label: 'Select Table', 
    icon: Circle, 
    description: 'Choose a table from the floor plan',
    order: 1 
  },
  seatPicker: { 
    label: 'Select Seat', 
    icon: User, 
    description: 'Pick the seat for this order',
    order: 2 
  },
  orderType: { 
    label: 'Order Type', 
    icon: Utensils, 
    description: 'Choose food or drink order',
    order: 3 
  },
  residentSelect: { 
    label: 'Select Resident', 
    icon: User, 
    description: 'Choose the resident for this order',
    order: 4 
  },
  voiceOrder: { 
    label: 'Voice Order', 
    icon: Mic, 
    description: 'Record the order using voice',
    order: 5 
  },
  confirmation: { 
    label: 'Confirm', 
    icon: CheckCircle, 
    description: 'Review and submit the order',
    order: 6 
  }
} as const

function OrderStepProgress({ currentStep }: { currentStep: OrderFlowStep }) {
  const currentOrder = STEP_CONFIG[currentStep]?.order || 1
  const totalSteps = Object.keys(STEP_CONFIG).length
  const progressPercentage = ((currentOrder - 1) / (totalSteps - 1)) * 100

  return (
    <div className="p-4 border-b border-gray-700/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">Order Process</h3>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          Step {currentOrder} of {totalSteps}
        </Badge>
      </div>
      
      <Progress 
        value={progressPercentage} 
        className="h-2 mb-3"
      />
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          {STEP_CONFIG[currentStep] && (() => {
            const StepIcon = STEP_CONFIG[currentStep].icon
            return (
              <>
                <StepIcon className="h-4 w-4" />
                <span>{STEP_CONFIG[currentStep].label}</span>
              </>
            )
          })()}
        </div>
        <span className="text-gray-500 text-xs">
          {STEP_CONFIG[currentStep]?.description}
        </span>
      </div>
    </div>
  )
}

function SeatNavigationStep() {
  const { state, actions } = useOrderFlow()
  
  if (!state.selectedTable) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a table first.
        </AlertDescription>
      </Alert>
    )
  }

  const handleSeatSelect = (seatNumber: number) => {
    actions.selectSeat(seatNumber)
  }

  // Assuming we have seat data from the table
  const seats = Array.from({ length: state.selectedTable.seats || 4 }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white">Select Seat</h4>
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Table {state.selectedTable.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {seats.map((seatNumber) => (
          <Button
            key={seatNumber}
            variant={state.selectedSeat === seatNumber ? "default" : "outline"}
            className={cn(
              "h-16 flex flex-col items-center justify-center gap-1",
              state.selectedSeat === seatNumber 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "border-gray-600 hover:bg-gray-800"
            )}
            onClick={() => handleSeatSelect(seatNumber)}
          >
            <User className="h-5 w-5" />
            <span className="text-sm">Seat {seatNumber}</span>
          </Button>
        ))}
      </div>
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => actions.goToStep('tableSelect')}
          className="border-gray-600 hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tables
        </Button>
      </div>
    </div>
  )
}

function OrderTypeStep() {
  const { state, actions } = useOrderFlow()
  
  const handleOrderTypeSelect = (type: 'food' | 'drink') => {
    actions.setOrderType(type)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white">Order Type</h4>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            Table {state.selectedTable?.label}
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            Seat {state.selectedSeat}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={state.orderType === 'food' ? "default" : "outline"}
          className={cn(
            "h-24 flex flex-col items-center justify-center gap-2",
            state.orderType === 'food' 
              ? "bg-orange-600 hover:bg-orange-700" 
              : "border-gray-600 hover:bg-gray-800"
          )}
          onClick={() => handleOrderTypeSelect('food')}
        >
          <Utensils className="h-8 w-8" />
          <span className="font-medium">Food Order</span>
        </Button>
        
        <Button
          variant={state.orderType === 'drink' ? "default" : "outline"}
          className={cn(
            "h-24 flex flex-col items-center justify-center gap-2",
            state.orderType === 'drink' 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "border-gray-600 hover:bg-gray-800"
          )}
          onClick={() => handleOrderTypeSelect('drink')}
        >
          <Coffee className="h-8 w-8" />
          <span className="font-medium">Drink Order</span>
        </Button>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => actions.goToStep('seatPicker')}
          className="border-gray-600 hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Seats
        </Button>
      </div>
    </div>
  )
}

function ResidentSelectionStep() {
  const { state, actions } = useOrderFlow()
  
  // Placeholder for resident selection logic
  // This would typically fetch residents and show a selection interface
  // const handleResidentSelect = (residentId: string) => {
  //   actions.selectResident(residentId)
  // }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white">Select Resident</h4>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {state.orderType === 'food' ? 'Food' : 'Drink'}
          </Badge>
        </div>
      </div>
      
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          Resident selection component will be implemented here.
          This would show available residents for the selected seat.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => actions.goToStep('orderType')}
          className="border-gray-600 hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Order Type
        </Button>
        
        <Button
          onClick={() => actions.goToStep('voiceOrder')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue to Voice Order
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function VoiceOrderStep() {
  const { actions } = useOrderFlow()
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white">Voice Order</h4>
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Ready to record
        </Badge>
      </div>
      
      <Alert>
        <Mic className="h-4 w-4" />
        <AlertDescription>
          Voice order panel will be implemented here.
          This would show the voice recording interface and transcription.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => actions.goToStep('residentSelect')}
          className="border-gray-600 hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resident
        </Button>
        
        <Button
          onClick={() => actions.goToStep('confirmation')}
          className="bg-green-600 hover:bg-green-700"
        >
          Complete Order
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function OrderProcessingContent() {
  const { state } = useOrderFlow()

  if (state.error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {state.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      {state.currentStep === 'tableSelect' && (
        <Alert>
          <Circle className="h-4 w-4" />
          <AlertDescription>
            Please select a table from the floor plan to start the order process.
          </AlertDescription>
        </Alert>
      )}
      
      {state.currentStep === 'seatPicker' && <SeatNavigationStep />}
      {state.currentStep === 'orderType' && <OrderTypeStep />}
      {state.currentStep === 'residentSelect' && <ResidentSelectionStep />}
      {state.currentStep === 'voiceOrder' && <VoiceOrderStep />}
      
      {state.currentStep === 'confirmation' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Order confirmation step will be implemented here.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export const OrderProcessingSection = memo<OrderProcessingSectionProps>(({ className }) => {
  const { state } = useOrderFlow()

  return (
    <Card className={cn(
      "bg-gray-800/40 border-gray-700/30 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-0">
        <OrderStepProgress currentStep={state.currentStep} />
        <OrderProcessingContent />
      </CardContent>
    </Card>
  )
})

OrderProcessingSection.displayName = 'OrderProcessingSection'