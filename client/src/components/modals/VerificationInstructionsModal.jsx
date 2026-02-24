import React, { useState } from "react";
import { FiX, FiCheck, FiCopy, FiExternalLink } from "react-icons/fi";
import toast from "react-hot-toast";

const platformInstructions = {
    leetcode: {
        title: "LeetCode Verification",
        location: "Summary (About Me)",
        url: (username) => `https://leetcode.com/${username}/`,
        steps: [
            "Visit your LeetCode profile page.",
            "Click 'Edit Profile'.",
            "Under the 'Summary' section, paste the token.",
            "Save and click 'Verify Now' below.",
            "Remove the token after verification is done."
        ]
    },
    github: {
        title: "GitHub Verification",
        location: "Bio",
        url: (username) => `https://github.com/${username}`,
        steps: [
            "Visit your GitHub profile page.",
            "Click 'Edit profile' (pencil icon on the left panel).",
            "Under the 'Bio' field, paste the token.",
            "Save and click 'Verify Now' below.",
            "Remove the token after verification is done."
        ]
    },
    codechef: {
        title: "CodeChef Verification",
        location: "Full Name",
        url: (username) => `https://www.codechef.com/users/${username}`,
        steps: [
            "Visit your CodeChef profile page.",
            "Click the ✏️ (pencil) edit icon.",
            "Under 'General', append the token to your name field.",
            "Save and click 'Verify Now' below.",
            "Remove the token after verification is done."
        ]
    },
    hackerrank: {
        title: "HackerRank Verification",
        location: "Headline",
        url: (username) => `https://www.hackerrank.com/profile/${username}`,
        steps: [
            "Visit your HackerRank profile page.",
            "Click the ✏️ edit icon on your profile.",
            "Under the 'Headline' section, paste the token.",
            "Save and click 'Verify Now' below.",
            "Remove the token after verification is done."
        ]
    },
    geeksforgeeks: {
        title: "GFG Verification",
        location: "About Me",
        url: (username) => `https://www.geeksforgeeks.org/profile/${username}/`,
        steps: [
            "Visit your GeeksforGeeks profile page.",
            "Click the ✏️ edit icon next to the 'About Me' section.",
            "Paste the token in the About Me text area.",
            "Save and click 'Verify Now' below.",
            "Remove the token after verification is done."
        ]
    }
};

export default function VerificationInstructionsModal({
    onClose,
    onSuccess,
    platform,
    username,
    token,
    userId
}) {
    const [loading, setLoading] = useState(false);
    const info = platformInstructions[platform];

    const handleVerify = async () => {
        setLoading(true);
        const toastId = toast.loading(`Verifying ${platform}...`);
        try {
            const response = await fetch(`/api/student/verify-coding-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, platform }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Verification failed");
            }

            toast.success("Verification successful!", { id: toastId });
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(token);
        toast.success("Token copied!");
    };

    if (!info) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FiX size={24} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{info.title}</h2>
                    <p className="text-sm text-gray-500">
                        Link your <span className="font-semibold text-gray-700 capitalize">{platform}</span> account by proving ownership.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Verification Token</span>
                        <button
                            onClick={copyToClipboard}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-semibold"
                        >
                            <FiCopy size={14} /> Copy
                        </button>
                    </div>
                    <div className="text-xl font-mono font-bold text-blue-900 tracking-wider">
                        {token}
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <FiCheck className="text-green-500" /> Instructions:
                    </h3>
                    <ul className="space-y-3">
                        {info.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-gray-600">
                                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                                    {idx + 1}
                                </span>
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <a
                        href={info.url(username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
                    >
                        Go to Profile <FiExternalLink />
                    </a>
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                            }`}
                    >
                        {loading ? "Verifying..." : "I've updated my profile, Verify Now!"}
                    </button>
                </div>

                <p className="mt-4 text-[10px] text-gray-400 text-center">
                    Note: Your profile must be public for our system to read the token.
                </p>
            </div>
        </div>
    );
}
