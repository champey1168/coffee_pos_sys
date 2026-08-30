<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller {

    public function index() {
        // ទាញយក Order ទាំងអស់ជាមួយ OrderDetails, Product និង Cashier (User)
        $orders = Order::with(['details.product', 'user'])
                        ->latest()
                        ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ], 200);
    }

    public function store(Request $request) {
        $request->validate([
            'order_type' => 'required|in:DINE_IN,TAKEAWAY',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($request) {
            // ១. បង្កើត Queue Number អូតូសម្រាប់ថ្ងៃនេះ (ឧទាហរណ៍: #01, #02, #03)
            $todayOrdersCount = Order::whereDate('created_at', now()->today())->count();
            $queueNumber = '#' . str_pad($todayOrdersCount + 1, 2, '0', STR_PAD_LEFT);

            // ២. បង្កើត Invoice Number uniquely (ឧទាហរណ៍: INV-20260828-142310)
            

            // Order Controller
            $invoice_number = 'INV-' . date('Ymd-His') . '-' . strtoupper(Str::random(4));

            // ៣. បង្កើត Order record
            $order = Order::create([
                'invoice_number' => $invoice_number,
                'queue_number'   => $queueNumber,
                'order_type'     => $request->order_type,
                'order_status'   => 'PENDING',
                'payment_status' => 'PAID',
                'total_amount'   => 0,
                'user_id'        => $request->user()->user_id ?? null, // Cashier Logged-in via Sanctum
            ]);

            $totalAmount = 0;

            // ៤. គណនា និងរក្សាទុក Order Details
            foreach ($request->items as $item) {
                $product = Product::where('product_id', $item['product_id'])->firstOrFail();
                $subtotal = $product->price * $item['quantity'];
                $totalAmount += $subtotal;

                OrderDetail::create([
                    'order_id'   => $order->order_id,
                    'product_id' => $product->product_id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal'   => $subtotal,
                ]);
            }

            // ៥. Update សរុបទឹកប្រាក់ចុងក្រោយ (Total Amount)
            $order->update(['total_amount' => $totalAmount]);

            return response()->json([
                'message' => 'Order created successfully',
                'data' => $order->load('details.product', 'user')
            ], 201);
        });
    }

    public function show($id) {
        $order = Order::with(['details.product', 'user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order
        ], 200);
    }
}