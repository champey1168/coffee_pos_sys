<?php

namespace App\Http\Controllers\Api; // ត្រូវប្រាកដថាមាន \Api ត្រង់នេះ

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data'   => User::with('roles')->get()
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username'   => 'required|string|max:255|unique:users,username',
            'full_name'  => 'required|string|max:255',
            'password'   => 'required|string|min:6|confirmed',
            'is_active'  => 'boolean',
            'role_ids'   => 'required|array',
            'role_ids.*' => 'exists:roles,role_id',
        ]);

        $user = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'username'      => $validated['username'],
                'full_name'     => $validated['full_name'],
                'password_hash' => Hash::make($validated['password']),
                'is_active'     => $request->input('is_active', true),
            ]);

            $user->roles()->attach($validated['role_ids']);

            return $user;
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully',
            'data'    => $user->load('roles')
        ], 201);
    }

    public function show($id)
    {
        $user = User::with('roles')->find($id);

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        return response()->json(['status' => 'success', 'data' => $user], 200);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'username'  => 'sometimes|required|string|max:255|unique:users,username,' . $id . ',user_id',
            'full_name' => 'sometimes|required|string|max:255',
            'password'  => 'nullable|string|min:6|confirmed',
            'is_active' => 'nullable|boolean',
            'role_ids'   => 'nullable|array',
            'role_ids.*' => 'exists:roles,role_id',
        ]);

        if (isset($validated['username']))  $user->username = $validated['username'];
        if (isset($validated['full_name'])) $user->full_name = $validated['full_name'];
        if (isset($validated['is_active'])) $user->is_active = $validated['is_active'];

        if (!empty($validated['password'])) {
            $user->password_hash = Hash::make($validated['password']);
        }

        $user->save();

        if (isset($validated['role_ids'])) {
            $user->roles()->sync($validated['role_ids']);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'User updated successfully',
            'data'    => $user->load('roles')
        ], 200);
    }

    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        $user->roles()->detach();
        $user->delete();

        return response()->json(['status' => 'success', 'message' => 'User deleted successfully'], 200);
    }
}