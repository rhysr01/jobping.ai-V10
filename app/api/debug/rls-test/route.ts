import { NextResponse } from "next/server";
import { getDatabaseClient } from "../../../../utils/core/database-pool";

export async function GET() {
	try {
		const supabase = getDatabaseClient();
		
		// Test 1: Check auth context
		const { data: authContext, error: authError } = await supabase.rpc('get_auth_context');
		
		// Test 2: Try to query users directly
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("id, email")
			.limit(1);
			
		// Test 3: Try to query a specific user
		const { data: specificUser, error: specificError } = await supabase
			.from("users")
			.select("id, email")
			.ilike("email", "rrrr555@gmail.com")
			.maybeSingle();

		return NextResponse.json({
			authContext: {
				data: authContext,
				error: authError?.message
			},
			usersQuery: {
				data: users,
				error: usersError?.message,
				count: users?.length || 0
			},
			specificUserQuery: {
				data: specificUser,
				error: specificError?.message,
				hasUser: !!specificUser
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return NextResponse.json({
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
}