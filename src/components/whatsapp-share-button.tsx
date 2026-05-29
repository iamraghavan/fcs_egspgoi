
"use client";

import { useState } from 'react';
import { shortenUrl } from '@/lib/url-shortener';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

type WhatsAppShareButtonProps = {
 facultyName: string;
 creditScore: number;
 facultyId: string;
};

export const WhatsAppShareButton = ({ facultyName, creditScore, facultyId }: WhatsAppShareButtonProps) => {
 const [loading, setLoading] = useState(false);

 const handleShare = async () => {
 setLoading(true);
 
 // 1. Construct the long dynamic URL
 const originalLink = `https://fcs.egspgroup.in/u/portal/dashboard?uid=${facultyId}`;
 
 // 2. Shorten it
 const shortLink = await shortenUrl(originalLink);

 // 3. Open WhatsApp with the short link
 const message = `High Score Alert! Prof. ${facultyName} has a credit score of ${creditScore}. Check their progress here: ${shortLink}`;
 window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
 
 setLoading(false);
 };

 return (
 <Button onClick={handleShare} disabled={loading} variant="outline">
 <Share2 className="mr-2 h-4 w-4"/>
 {loading ? 'Generating Link...' : 'Share on WhatsApp'}
 </Button>
 );
};
