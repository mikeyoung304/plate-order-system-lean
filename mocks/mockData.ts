// Mock data for the application to replace backend API calls

// Mock tables for floor plans
export const mockTables = {
  default: [
    {
      id: "table-1",
      floor_plan_id: "default",
      label: "1",
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-2",
      floor_plan_id: "default",
      label: "2",
      x: 250,
      y: 100,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-3",
      floor_plan_id: "default",
      label: "3",
      x: 400,
      y: 100,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-4",
      floor_plan_id: "default",
      label: "4",
      x: 100,
      y: 250,
      width: 120,
      height: 80,
      type: "rectangle",
      seats: 6,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-5",
      floor_plan_id: "default",
      label: "5",
      x: 300,
      y: 250,
      width: 120,
      height: 80,
      type: "rectangle",
      seats: 6,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-6",
      floor_plan_id: "default",
      label: "6",
      x: 100,
      y: 400,
      width: 140,
      height: 80,
      type: "rectangle",
      seats: 8,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-7",
      floor_plan_id: "default",
      label: "7",
      x: 300,
      y: 400,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    }
  ]
};

// Mock API functions that simulate backend behavior
export const mockAPI = {
  // Get tables for a floor plan
  getTables: async (floorPlanId: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockTables[floorPlanId as keyof typeof mockTables] || [];
  },
  
  // Update tables for a floor plan
  updateTables: async (floorPlanId: string, tables: any[]) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Update the mock tables
    if (floorPlanId in mockTables) {
      mockTables[floorPlanId as keyof typeof mockTables] = tables;
    }
    
    return tables;
  }
}; 