import { toast } from "sonner";

export const showToast = {
	success: (message: string) => {
		toast.success(message);
	},
	error: (message: string) => {
		toast.error(message);
	},
	loading: (message: string) => {
		return toast.loading(message);
	},
	info: (message: string) => {
		toast(message);
	},
	promise: <T>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: Error) => string);
		},
	) => {
		return toast.promise(promise, {
			loading: messages.loading,
			success: messages.success,
			error: messages.error,
		});
	},
};
