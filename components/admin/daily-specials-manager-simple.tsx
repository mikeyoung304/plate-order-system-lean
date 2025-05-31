/**
 * VETERAN'S NOTES: Daily Specials Manager - Bulletproof CRUD State Machine
 * 
 * WHY: The original had 5 useState calls with complex form state causing chaos. Edit vs create
 * modes could conflict, form validation was scattered, and loading states got out of sync.
 * Classic CRUD useState explosion that makes bugs impossible to debug.
 * 
 * WHAT: Consolidated all CRUD operations into a single useReducer with clear phases.
 * State machine prevents impossible states (editing while creating, saving without validation).
 * Built-in form validation and error handling. Clear separation of concerns.
 * 
 * WHEN TO TOUCH: Only for new form fields or CRUD operations. Don't add useState
 * for "simple" form state - it breaks consistency with the reducer state.
 * 
 * WHO TO BLAME: Veteran engineer - this pattern handles complex form workflows
 * 
 * HOW TO MODIFY:
 * - Add new form fields to FormData interface and initialFormData
 * - Add corresponding actions to SpecialsManagerAction
 * - Add validation logic to validateFormData function
 * - Keep async operations in the hook, not the reducer
 * - Test rapid user interactions (double-clicks, form switches)
 */

"use client"

import React, { useReducer, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Clock, Users, DollarSign, Tag, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  getAllDailySpecials, 
  createDailySpecial, 
  updateDailySpecial, 
  deleteDailySpecial,
  type DailySpecial 
} from '@/lib/modassembly/supabase/database/daily-specials'

// FORM DATA STRUCTURE
interface FormData {
  name: string
  description: string
  meal_period: 'breakfast' | 'lunch' | 'dinner' | 'all_day'
  price: string
  ingredients: string
  dietary_tags: string
  max_orders: string
  preparation_time_minutes: string
  available_date: string
}

// VALIDATION ERRORS
interface ValidationErrors {
  [key: string]: string | undefined
}

// SPECIALS MANAGER STATE - all related state in one place
interface SpecialsManagerState {
  // CRUD operation phases
  phase: 'loading' | 'viewing' | 'creating' | 'editing' | 'saving' | 'deleting' | 'error'
  
  // Data state
  specials: DailySpecial[]
  
  // Form state
  form: {
    data: FormData
    originalData: FormData | null
    validationErrors: ValidationErrors
    isValid: boolean
  }
  
  // UI state
  ui: {
    showDialog: boolean
    editingSpecialId: string | null
  }
  
  // Operation state
  operation: {
    type: 'none' | 'create' | 'update' | 'delete'
    target: string | null
    error: string | null
  }
}

// ATOMIC ACTIONS - each action represents one complete state transition
type SpecialsManagerAction =
  | { type: 'START_LOADING' }
  | { type: 'LOAD_SUCCESS'; specials: DailySpecial[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'START_CREATE' }
  | { type: 'START_EDIT'; special: DailySpecial }
  | { type: 'UPDATE_FORM_FIELD'; field: keyof FormData; value: string }
  | { type: 'VALIDATE_FORM' }
  | { type: 'START_SAVE'; operationType: 'create' | 'update' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'START_DELETE'; specialId: string }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'DELETE_ERROR'; error: string }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'RESET_OPERATION' }

// INITIAL FORM DATA
const initialFormData: FormData = {
  name: '',
  description: '',
  meal_period: 'lunch',
  price: '',
  ingredients: '',
  dietary_tags: '',
  max_orders: '',
  preparation_time_minutes: '20',
  available_date: new Date().toISOString().split('T')[0]
}

// INITIAL STATE
const initialState: SpecialsManagerState = {
  phase: 'loading',
  specials: [],
  form: {
    data: initialFormData,
    originalData: null,
    validationErrors: {},
    isValid: false
  },
  ui: {
    showDialog: false,
    editingSpecialId: null
  },
  operation: {
    type: 'none',
    target: null,
    error: null
  }
}

// FORM VALIDATION (pure function)
const validateFormData = (data: FormData): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {}
  
  if (!data.name.trim()) {
    errors.name = 'Name is required'
  }
  
  if (!data.description.trim()) {
    errors.description = 'Description is required'
  }
  
  if (data.price && isNaN(parseFloat(data.price))) {
    errors.price = 'Price must be a valid number'
  }
  
  if (data.max_orders && isNaN(parseInt(data.max_orders))) {
    errors.max_orders = 'Max orders must be a valid number'
  }
  
  if (!data.preparation_time_minutes || isNaN(parseInt(data.preparation_time_minutes))) {
    errors.preparation_time_minutes = 'Preparation time is required and must be a number'
  }
  
  if (!data.available_date) {
    errors.available_date = 'Available date is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// CONVERT DAILY SPECIAL TO FORM DATA (pure function)
const specialToFormData = (special: DailySpecial): FormData => ({
  name: special.name,
  description: special.description,
  meal_period: special.meal_period,
  price: special.price?.toString() || '',
  ingredients: special.ingredients.join(', '),
  dietary_tags: special.dietary_tags.join(', '),
  max_orders: special.max_orders?.toString() || '',
  preparation_time_minutes: special.preparation_time_minutes.toString(),
  available_date: special.available_date
})

// PURE REDUCER - handles all state transitions
function specialsManagerReducer(
  state: SpecialsManagerState, 
  action: SpecialsManagerAction
): SpecialsManagerState {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        phase: 'loading',
        operation: { type: 'none', target: null, error: null }
      }
    
    case 'LOAD_SUCCESS':
      return {
        ...state,
        phase: 'viewing',
        specials: action.specials
      }
    
    case 'LOAD_ERROR':
      return {
        ...state,
        phase: 'error',
        operation: { type: 'none', target: null, error: action.error }
      }
    
    case 'START_CREATE': {
      const validation = validateFormData(initialFormData)
      return {
        ...state,
        phase: 'creating',
        form: {
          data: initialFormData,
          originalData: null,
          validationErrors: validation.errors,
          isValid: validation.isValid
        },
        ui: {
          showDialog: true,
          editingSpecialId: null
        },
        operation: { type: 'create', target: null, error: null }
      }
    }
    
    case 'START_EDIT': {
      const formData = specialToFormData(action.special)
      const validation = validateFormData(formData)
      return {
        ...state,
        phase: 'editing',
        form: {
          data: formData,
          originalData: formData,
          validationErrors: validation.errors,
          isValid: validation.isValid
        },
        ui: {
          showDialog: true,
          editingSpecialId: action.special.id
        },
        operation: { type: 'update', target: action.special.id, error: null }
      }
    }
    
    case 'UPDATE_FORM_FIELD': {
      const newData = { ...state.form.data, [action.field]: action.value }
      const validation = validateFormData(newData)
      return {
        ...state,
        form: {
          ...state.form,
          data: newData,
          validationErrors: validation.errors,
          isValid: validation.isValid
        }
      }
    }
    
    case 'VALIDATE_FORM': {
      const validation = validateFormData(state.form.data)
      return {
        ...state,
        form: {
          ...state.form,
          validationErrors: validation.errors,
          isValid: validation.isValid
        }
      }
    }
    
    case 'START_SAVE':
      return {
        ...state,
        phase: 'saving',
        operation: { ...state.operation, type: action.operationType, error: null }
      }
    
    case 'SAVE_SUCCESS':
      return {
        ...state,
        phase: 'viewing',
        ui: { showDialog: false, editingSpecialId: null },
        form: {
          data: initialFormData,
          originalData: null,
          validationErrors: {},
          isValid: false
        },
        operation: { type: 'none', target: null, error: null }
      }
    
    case 'SAVE_ERROR':
      return {
        ...state,
        phase: state.operation.type === 'create' ? 'creating' : 'editing',
        operation: { ...state.operation, error: action.error }
      }
    
    case 'START_DELETE':
      return {
        ...state,
        phase: 'deleting',
        operation: { type: 'delete', target: action.specialId, error: null }
      }
    
    case 'DELETE_SUCCESS':
      return {
        ...state,
        phase: 'viewing',
        operation: { type: 'none', target: null, error: null }
      }
    
    case 'DELETE_ERROR':
      return {
        ...state,
        phase: 'viewing',
        operation: { type: 'none', target: null, error: action.error }
      }
    
    case 'CLOSE_DIALOG':
      return {
        ...state,
        phase: 'viewing',
        ui: { showDialog: false, editingSpecialId: null },
        form: {
          data: initialFormData,
          originalData: null,
          validationErrors: {},
          isValid: false
        },
        operation: { type: 'none', target: null, error: null }
      }
    
    case 'RESET_OPERATION':
      return {
        ...state,
        operation: { type: 'none', target: null, error: null }
      }
    
    default:
      return state
  }
}

/**
 * SIMPLE, RELIABLE DAILY SPECIALS MANAGER
 * 
 * Manages complex CRUD operations with form validation in a predictable way.
 * No useState chaos. No race conditions. Clear state machine.
 */
export function DailySpecialsManagerSimple() {
  const [state, dispatch] = useReducer(specialsManagerReducer, initialState)
  const { toast } = useToast()

  // Load specials (single responsibility)
  const loadSpecials = useCallback(async () => {
    dispatch({ type: 'START_LOADING' })
    
    try {
      const data = await getAllDailySpecials()
      dispatch({ type: 'LOAD_SUCCESS', specials: data })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load daily specials'
      console.error('Failed to load specials:', error)
      dispatch({ type: 'LOAD_ERROR', error: message })
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }, [toast])

  // Save special (create or update)
  const saveSpecial = useCallback(async () => {
    if (!state.form.isValid) {
      dispatch({ type: 'VALIDATE_FORM' })
      return
    }
    
    const operationType = state.operation.type as 'create' | 'update'
    dispatch({ type: 'START_SAVE', operationType })

    try {
      const specialData = {
        name: state.form.data.name,
        description: state.form.data.description,
        meal_period: state.form.data.meal_period,
        price: state.form.data.price ? parseFloat(state.form.data.price) : undefined,
        ingredients: state.form.data.ingredients.split(',').map(i => i.trim()).filter(i => i),
        dietary_tags: state.form.data.dietary_tags.split(',').map(t => t.trim()).filter(t => t),
        max_orders: state.form.data.max_orders ? parseInt(state.form.data.max_orders) : undefined,
        preparation_time_minutes: parseInt(state.form.data.preparation_time_minutes),
        available_date: state.form.data.available_date,
        is_active: true
      }

      if (operationType === 'update' && state.ui.editingSpecialId) {
        await updateDailySpecial(state.ui.editingSpecialId, specialData)
        toast({
          title: 'Success',
          description: 'Daily special updated successfully'
        })
      } else {
        await createDailySpecial(specialData)
        toast({
          title: 'Success',
          description: 'Daily special created successfully'
        })
      }

      dispatch({ type: 'SAVE_SUCCESS' })
      loadSpecials() // Refresh data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save daily special'
      console.error('Failed to save special:', error)
      dispatch({ type: 'SAVE_ERROR', error: message })
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }, [state.form, state.operation.type, state.ui.editingSpecialId, loadSpecials, toast])

  // Delete special
  const deleteSpecial = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this special?')) return
    
    dispatch({ type: 'START_DELETE', specialId: id })

    try {
      await deleteDailySpecial(id)
      dispatch({ type: 'DELETE_SUCCESS' })
      
      toast({
        title: 'Success',
        description: 'Daily special deleted successfully'
      })
      
      loadSpecials() // Refresh data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete daily special'
      console.error('Failed to delete special:', error)
      dispatch({ type: 'DELETE_ERROR', error: message })
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }, [loadSpecials, toast])

  // Load specials on mount
  useEffect(() => {
    loadSpecials()
  }, [loadSpecials])

  // Get meal period color (pure function)
  const getMealPeriodColor = (period: string) => {
    switch (period) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800'
      case 'lunch':
        return 'bg-blue-100 text-blue-800'
      case 'dinner':
        return 'bg-purple-100 text-purple-800'
      case 'all_day':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading state
  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-600" />
        <span>Loading daily specials...</span>
      </div>
    )
  }

  // Error state
  if (state.phase === 'error') {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error: {state.operation.error}</div>
        <Button onClick={loadSpecials}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Specials Management</h2>
        <Dialog open={state.ui.showDialog} onOpenChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_DIALOG' })
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => dispatch({ type: 'START_CREATE' })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Special
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {state.phase === 'editing' ? 'Edit Special' : 'Create New Special'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              saveSpecial()
            }} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={state.form.data.name}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'name', value: e.target.value })}
                  className={state.form.validationErrors.name ? 'border-red-500' : ''}
                  required
                />
                {state.form.validationErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{state.form.validationErrors.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={state.form.data.description}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'description', value: e.target.value })}
                  className={state.form.validationErrors.description ? 'border-red-500' : ''}
                  required
                />
                {state.form.validationErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{state.form.validationErrors.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meal_period">Meal Period</Label>
                  <Select
                    value={state.form.data.meal_period}
                    onValueChange={(value) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'meal_period', value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="all_day">All Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={state.form.data.price}
                    onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'price', value: e.target.value })}
                    className={state.form.validationErrors.price ? 'border-red-500' : ''}
                  />
                  {state.form.validationErrors.price && (
                    <p className="text-red-500 text-xs mt-1">{state.form.validationErrors.price}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
                <Input
                  id="ingredients"
                  value={state.form.data.ingredients}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'ingredients', value: e.target.value })}
                  placeholder="chicken, rice, vegetables"
                />
              </div>
              
              <div>
                <Label htmlFor="dietary_tags">Dietary Tags (comma-separated)</Label>
                <Input
                  id="dietary_tags"
                  value={state.form.data.dietary_tags}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'dietary_tags', value: e.target.value })}
                  placeholder="vegetarian, gluten-free"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_orders">Max Orders (optional)</Label>
                  <Input
                    id="max_orders"
                    type="number"
                    value={state.form.data.max_orders}
                    onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'max_orders', value: e.target.value })}
                    className={state.form.validationErrors.max_orders ? 'border-red-500' : ''}
                  />
                  {state.form.validationErrors.max_orders && (
                    <p className="text-red-500 text-xs mt-1">{state.form.validationErrors.max_orders}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="prep_time">Prep Time (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    value={state.form.data.preparation_time_minutes}
                    onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'preparation_time_minutes', value: e.target.value })}
                    className={state.form.validationErrors.preparation_time_minutes ? 'border-red-500' : ''}
                    required
                  />
                  {state.form.validationErrors.preparation_time_minutes && (
                    <p className="text-red-500 text-xs mt-1">{state.form.validationErrors.preparation_time_minutes}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="available_date">Available Date</Label>
                <Input
                  id="available_date"
                  type="date"
                  value={state.form.data.available_date}
                  onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', field: 'available_date', value: e.target.value })}
                  className={state.form.validationErrors.available_date ? 'border-red-500' : ''}
                  required
                />
                {state.form.validationErrors.available_date && (
                  <p className="text-red-500 text-xs mt-1">{state.form.validationErrors.available_date}</p>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => dispatch({ type: 'CLOSE_DIALOG' })}
                  disabled={state.phase === 'saving'}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!state.form.isValid || state.phase === 'saving'}
                >
                  {state.phase === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    state.phase === 'editing' ? 'Update' : 'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Specials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.specials.map((special) => (
          <Card key={special.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{special.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'START_EDIT', special })}
                    disabled={state.phase === 'deleting' && state.operation.target === special.id}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSpecial(special.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={state.phase === 'deleting'}
                  >
                    {state.phase === 'deleting' && state.operation.target === special.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getMealPeriodColor(special.meal_period)}>
                  {special.meal_period.replace('_', ' ')}
                </Badge>
                {special.price && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {special.price}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{special.description}</p>
              
              {special.ingredients.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Ingredients:</div>
                  <div className="flex flex-wrap gap-1">
                    {special.ingredients.map((ingredient, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {special.dietary_tags.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Dietary:</div>
                  <div className="flex flex-wrap gap-1">
                    {special.dietary_tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {special.preparation_time_minutes}m prep
                </div>
                {special.max_orders && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {special.current_orders}/{special.max_orders} ordered
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                Available: {new Date(special.available_date).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Empty State */}
      {state.specials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium mb-2">No Daily Specials</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first daily special</p>
          <Button onClick={() => dispatch({ type: 'START_CREATE' })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Special
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * MIGRATION NOTES:
 * 
 * BEFORE (useState explosion):
 * - 5 separate useState calls for CRUD operations
 * - Complex form state managed as single object
 * - Edit vs create modes could conflict
 * - Form validation scattered throughout component
 * - Loading states could get out of sync with operations
 * 
 * AFTER (useReducer pattern):
 * - Single state object with clear CRUD phases
 * - Built-in form validation with real-time feedback
 * - State machine prevents impossible states
 * - Clear separation between form, UI, and operation state
 * - Atomic transitions for all async operations
 * 
 * CRUD FORM PATTERNS:
 * 
 * 1. ALWAYS use useReducer for CRUD interfaces with forms
 * 2. Build validation into the reducer for immediate feedback
 * 3. Separate form data from UI state (dialogs, editing modes)
 * 4. Use clear phases (viewing, creating, editing, saving, deleting)
 * 5. Test rapid user interactions (double-clicks, mode switches)
 * 
 * VETERAN'S LESSON:
 * CRUD interfaces are complex state machines with forms, validation,
 * and async operations. useState creates bugs that only appear with
 * specific user interaction patterns (rapid clicks, form switches).
 * 
 * A junior developer trying to debug "why the form sometimes submits
 * invalid data" with 5 useState variables will spend days.
 * 
 * With a state machine, you can see exactly which phase the CRUD
 * interface is in and what actions are valid from that state.
 * 
 * Choose debuggability over "simplicity".
 */