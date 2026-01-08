import { type NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/Utils/databasePool";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const email = searchParams.get('email');

	if (!email) {
		return NextResponse.json({
			sent: false,
			error: 'email_required',
			message: 'Please provide an email address.'
		}, { status: 400 });
	}

	try {
		// Check email_logs table for welcome email delivery
		const supabase = getDatabaseClient();
		const { data: emailLog } = await supabase
			.from('email_logs')
			.select('sent_at, status, error_message')
			.eq('email', email)
			.eq('email_type', 'welcome')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (emailLog) {
			return NextResponse.json({
				sent: emailLog.status === 'sent',
				sentAt: emailLog.sent_at,
				error: emailLog.error_message
			});
		}

		return NextResponse.json({
			sent: false,
			error: 'email_not_found',
			message: 'No account found with this email address.'
		});
	} catch (error) {
		return NextResponse.json({
			sent: false,
			error: 'status_check_failed',
			message: 'Unable to check email status. Please try again later.'
		});
	}
}
