"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ChefHat, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/lib/modassembly/supabase/auth";
import { fetchRecentOrders, updateOrderStatus, type Order } from "@/lib/modassembly/supabase/database/orders";
import { createClient } from "@/lib/modassembly/supabase/client";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initial load of orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRecentOrders(50); // Get up to 50 recent orders
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        toast({ 
          title: 'Error', 
          description: 'Could not load orders. Please refresh the page.', 
          variant: 'destructive' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();

    // Set up real-time subscription for order updates
    const supabase = createClient();
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Kitchen received order update:', payload);
          // Reload orders when any order changes
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Update order status
  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Optimistically update the UI
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      await updateOrderStatus(orderId, newStatus);

      toast({
        title: "Order updated",
        description: `Order ${orderId} marked as ${newStatus.replace('_', ' ')}`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
      
      // Revert the optimistic update
      const data = await fetchRecentOrders(50);
      setOrders(data);
    }
  };

  // Get status-specific actions for an order
  const getOrderActions = (order: Order) => {
    switch (order.status) {
      case 'new':
      case 'in_progress':
        return (
          <div className="flex gap-2 mt-2">
            {order.status === 'new' && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ChefHat className="h-4 w-4 mr-1" />
                Start Cooking
              </Button>
            )}
            {order.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(order.id, 'ready')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Ready
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusUpdate(order.id, 'delivered')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        );
      case 'ready':
        return (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm mt-2">
            Ready for pickup
          </div>
        );
      case 'delivered':
        return (
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm mt-2">
            Order completed
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute roles="cook">
      <div className="p-8 bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold text-white mb-4">Kitchen View</h1>
      <ScrollArea className="h-[80vh]">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700/30 animate-pulse">
                <CardContent className="h-24"></CardContent>
              </Card>
            ))
          ) : orders.length === 0 ? (
            <p className="text-gray-400">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className={`bg-gray-800/50 border-gray-700/30 kds-order kds-order-${order.status}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{order.table}, Seat {order.seat}</div>
                      <div className="text-sm text-gray-300 mt-1">
                        {order.items && order.items.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={`status-badge status-${order.status}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </Badge>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {getOrderActions(order)}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
    </ProtectedRoute>
  );
}