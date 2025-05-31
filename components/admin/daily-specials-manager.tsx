"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Clock, Users, DollarSign, Tag } from 'lucide-react'

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

export function DailySpecialsManager() {
  const [specials, setSpecials] = useState<DailySpecial[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSpecial, setEditingSpecial] = useState<DailySpecial | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meal_period: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'all_day',
    price: '',
    ingredients: '',
    dietary_tags: '',
    max_orders: '',
    preparation_time_minutes: '20',
    available_date: new Date().toISOString().split('T')[0]
  })
  
  const { toast } = useToast()

  useEffect(() => {
    loadSpecials()
  }, [])

  const loadSpecials = async () => {
    try {
      setLoading(true)
      const data = await getAllDailySpecials()
      setSpecials(data)
    } catch (error) {
      console.error('Failed to load specials:', error)
      toast({
        title: 'Error',
        description: 'Failed to load daily specials',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      meal_period: 'lunch',
      price: '',
      ingredients: '',
      dietary_tags: '',
      max_orders: '',
      preparation_time_minutes: '20',
      available_date: new Date().toISOString().split('T')[0]
    })
    setEditingSpecial(null)
  }

  const handleEdit = (special: DailySpecial) => {
    setEditingSpecial(special)
    setFormData({
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
    setShowCreateDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const specialData = {
        name: formData.name,
        description: formData.description,
        meal_period: formData.meal_period,
        price: formData.price ? parseFloat(formData.price) : undefined,
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
        dietary_tags: formData.dietary_tags.split(',').map(t => t.trim()).filter(t => t),
        max_orders: formData.max_orders ? parseInt(formData.max_orders) : undefined,
        preparation_time_minutes: parseInt(formData.preparation_time_minutes),
        available_date: formData.available_date,
        is_active: true
      }

      if (editingSpecial) {
        await updateDailySpecial(editingSpecial.id, specialData)
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

      setShowCreateDialog(false)
      resetForm()
      loadSpecials()
    } catch (error) {
      console.error('Failed to save special:', error)
      toast({
        title: 'Error',
        description: 'Failed to save daily special',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this special?')) return
    
    try {
      await deleteDailySpecial(id)
      toast({
        title: 'Success',
        description: 'Daily special deleted successfully'
      })
      loadSpecials()
    } catch (error) {
      console.error('Failed to delete special:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete daily special',
        variant: 'destructive'
      })
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading daily specials...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Specials Management</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Special
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSpecial ? 'Edit Special' : 'Create New Special'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meal_period">Meal Period</Label>
                  <Select
                    value={formData.meal_period}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, meal_period: value as any }))}
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
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
                <Input
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="chicken, rice, vegetables"
                />
              </div>
              
              <div>
                <Label htmlFor="dietary_tags">Dietary Tags (comma-separated)</Label>
                <Input
                  id="dietary_tags"
                  value={formData.dietary_tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, dietary_tags: e.target.value }))}
                  placeholder="vegetarian, gluten-free"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_orders">Max Orders (optional)</Label>
                  <Input
                    id="max_orders"
                    type="number"
                    value={formData.max_orders}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_orders: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="prep_time">Prep Time (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    value={formData.preparation_time_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparation_time_minutes: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="available_date">Available Date</Label>
                <Input
                  id="available_date"
                  type="date"
                  value={formData.available_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, available_date: e.target.value }))}
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSpecial ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specials.map((special) => (
          <Card key={special.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{special.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(special)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(special.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
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
      
      {specials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium mb-2">No Daily Specials</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first daily special</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Special
          </Button>
        </div>
      )}
    </div>
  )
}