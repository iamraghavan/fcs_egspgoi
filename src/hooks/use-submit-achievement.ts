
"use client";

import { useState } from"react";
import type { AchievementFormData } from"@/components/achievement-form";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function useSubmitAchievement() {
 const [isLoading, setIsLoading] = useState(false);

 const submitAchievement = async (formData: AchievementFormData) => {
 setIsLoading(true);

 const token = localStorage.getItem("token");
 if (!token) {
 setIsLoading(false);
 throw new Error("Authentication error. Please log in again.");
 }
 
 const { title, points, academicYear, proof, creditTitleId, notes } = formData;

 const submissionData = new FormData();
 submissionData.append("title", title);
 submissionData.append("points", points.toString());
 submissionData.append("academicYear", academicYear);
 if (proof) {
 submissionData.append("proof", proof);
 }
 if (creditTitleId) {
 submissionData.append("categories", creditTitleId);
 }
 if (notes) {
 submissionData.append("notes", notes);
 }
 
 try {
 const response = await fetch(`${API_BASE_URL}/api/v1/credits/credits/positive`, {
 method:"POST",
 headers: {
"Authorization": `Bearer ${token}`,
 },
 body: submissionData,
 });
 
 const responseData = await response.json();

 if (!response.ok) {
 let errorMessage ="Submission failed due to a server error.";
 if (responseData.message) {
 errorMessage = responseData.message;
 } else if (response.status === 404) {
 errorMessage ="API endpoint not found. Please contact support.";
 } else if (response.status === 403) {
 errorMessage ="A security error occurred. Please refresh the page and try again.";
 } else if (response.statusText.includes("Not Found")) {
 errorMessage = `API endpoint not found at ${response.url}. Please check the API route.`;
 }
 throw new Error(errorMessage);
 }
 
 if (!responseData.success) {
 throw new Error(responseData.message ||"An unknown error occurred during submission.");
 }

 return responseData;

 } finally {
 setIsLoading(false);
 }
 };

 return { submitAchievement, isLoading };
}
