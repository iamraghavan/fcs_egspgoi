
"use client";

import { useState, useEffect } from"react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export type CreditTitle = {
 _id: string;
 title: string;
 points: number;
 type: 'positive' | 'negative';
};

export function useCreditTitles() {
 const [creditTitles, setCreditTitles] = useState<CreditTitle[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 const fetchCreditTitles = async () => {
 setIsLoading(true);
 setError(null);
 const token = localStorage.getItem("token");
 if (!token) {
 setError("Authentication required.");
 setIsLoading(false);
 return;
 }

 try {
 const response = await fetch(`${API_BASE_URL}/admin/credit-title`, {
 headers: {
"Authorization": `Bearer ${token}`
 }
 });

 if (!response.ok) {
 const errorText = await response.text();
 try {
 const errorJson = JSON.parse(errorText);
 throw new Error(errorJson.message || `Server returned status ${response.status}`);
 } catch (e) {
 throw new Error("Failed to fetch credit titles. The API endpoint may be incorrect.");
 }
 }

 const responseData = await response.json();
 if (responseData.success) {
 // Filter for only 'positive' credit titles for achievement submission
 setCreditTitles(responseData.items.filter((ct: CreditTitle) => ct.type === 'positive'));
 } else {
 throw new Error(responseData.message ||"An unknown error occurred while fetching titles.");
 }
 } catch (e: any) {
 setError(e.message);
 console.error("Failed to fetch credit titles:", e);
 } finally {
 setIsLoading(false);
 }
 };

 fetchCreditTitles();
 }, []);

 return { creditTitles, isLoading, error };
}
