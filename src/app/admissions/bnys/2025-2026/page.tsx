
"use client";

import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useAlert } from '@/context/alert-context';
import { Loader2, Mail, User, Phone, University, BookOpen, MapPin, CheckCircle } from 'lucide-react';
import { useGooglePlaces } from '@/hooks/use-google-places';
import Image from 'next/image';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import { saveAdmissionEnquiry } from '@/lib/admissions';
import { MuiTelInput } from 'mui-tel-input';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const muiTheme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '--TextField-brandBorderColor': 'hsl(var(--input))',
          '--TextField-brandBorderHoverColor': 'hsl(var(--ring))',
          '--TextField-brandBorderFocusedColor': 'hsl(var(--ring))',
          '& label.Mui-focused': {
            color: 'hsl(var(--foreground))',
          },
        },
      },
    },
     MuiOutlinedInput: {
      styleOverrides: {
        root: {
            fontFamily: 'inherit',
            color: 'hsl(var(--foreground))',
            borderRadius: 'var(--radius)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--TextField-brandBorderHoverColor)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--TextField-brandBorderFocusedColor)',
                borderWidth: '2px',
            },
        },
        notchedOutline: {
            borderColor: 'var(--TextField-brandBorderColor)',
        }
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
           backgroundColor: 'hsl(var(--card))',
           color: 'hsl(var(--card-foreground))',
        }
      }
    }
  },
});


export default function AdmissionEnquiryPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const addressRef = useRef<HTMLInputElement>(null);
  const { loaded, error } = useGooglePlaces();

  const parseAddressComponents = (place: google.maps.places.PlaceResult): string => {
    if (!place.address_components) {
        return place.formatted_address || place.name || '';
    }

    const componentMap: { [key: string]: string } = {};
    place.address_components.forEach(component => {
        const type = component.types[0];
        componentMap[type] = component.long_name;
    });
    
    // Construct a detailed address string. You can adjust the format as needed.
    const address_line_1 = [componentMap.street_number, componentMap.route].filter(Boolean).join(' ');
    const address_line_2 = [componentMap.sublocality_level_2, componentMap.sublocality_level_1].filter(Boolean).join(', ');
    const city = componentMap.locality || '';
    const district = componentMap.administrative_area_level_2 || '';
    const state = componentMap.administrative_area_level_1 || '';
    const postalCode = componentMap.postal_code || '';
    const country = componentMap.country || '';

    const parts = [address_line_1, address_line_2, city, district, state, postalCode, country].filter(part => part && part.trim() !== '');

    return parts.join(', ');
  }

  useEffect(() => {
    if (loaded && addressRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'geometry', 'icon', 'name', 'formatted_address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place) {
            const detailedAddress = parseAddressComponents(place);
            setFullAddress(detailedAddress);
            if (addressRef.current) {
                addressRef.current.value = detailedAddress;
            }
        }
      });
    }
  }, [loaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone) {
        showAlert("Incomplete Form", "Please fill in your name and phone number.");
        return;
    }

    const finalAddress = fullAddress || addressRef.current?.value || '';

    setIsSubmitting(true);
    try {
        const formData = {
            name,
            phone,
            email,
            college: "EGS Pillay Naturopathy and Yoga Science",
            course: "BNYS - Bachelor of Naturopathy and Yogic Sciences",
            address: finalAddress,
            enquiryDate: new Date().toISOString()
        };

        await saveAdmissionEnquiry(formData);
        
        setIsSubmitted(true);
        toast({
            title: "Enquiry Submitted!",
            description: "Thank you for your interest. We will get back to you shortly.",
        });

    } catch (err: any) {
        showAlert("Submission Failed", err.message || "An unexpected error occurred. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl">Thank You!</CardTitle>
                    <CardDescription>Your enquiry has been successfully submitted.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Our admissions team will review your information and contact you soon. You can now close this window.</p>
                </CardContent>
            </Card>
        </main>
    )
  }

  return (
    <>
    <Head>
        <title>Admission Enquiry: BNYS 2025-2026</title>
        <meta name="description" content="Enquire about admission for the Bachelor of Naturopathy and Yogic Sciences (BNYS) course for the academic year 2025-2026." />
        <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '660713297027148'); 
                fbq('track', 'PageView');
              `,
            }}
        />
        <noscript>
            <img height="1" width="1" style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=660713297027148&ev=PageView&noscript=1" alt="" />
        </noscript>
    </Head>
    <ThemeProvider theme={muiTheme}>
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <Image src={EgspgoiLogo} alt="EGS Pillay Group of Institutions Logo" width={80} height={80} className="mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Admission Enquiry: 2025-2026</CardTitle>
          <CardDescription>Bachelor of Naturopathy and Yogic Sciences (BNYS)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <Label htmlFor="college">College Name</Label>
                    <div className="relative mt-2">
                        <University className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <Input id="college" value="EGS Pillay Naturopathy and Yoga Science" readOnly className="pl-10 bg-muted/50 cursor-not-allowed" />
                    </div>
                </div>
                <div>
                    <Label htmlFor="course">Course</Label>
                     <div className="relative mt-2">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <Input id="course" value="BNYS" readOnly className="pl-10 bg-muted/50 cursor-not-allowed" />
                    </div>
                </div>
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10" />
              </div>
            </div>
             <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-2">
                    <MuiTelInput
                        id="phone"
                        value={phone}
                        onChange={(newValue) => setPhone(newValue)}
                        defaultCountry="IN"
                        onlyCountries={['IN', 'US', 'GB', 'AU', 'AE']}
                        fullWidth
                        variant="outlined"
                        required
                        aria-required="true"
                    />
                </div>
            </div>
             <div>
              <Label htmlFor="email">Email Address (Optional)</Label>
               <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address / Location</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="address"
                  ref={addressRef}
                  placeholder={loaded ? "Start typing your address..." : "Loading map..."}
                  disabled={!loaded}
                  className="pl-10"
                  onChange={(e) => setFullAddress(e.target.value)}
                />
                {error && <p className="text-xs text-red-500 mt-1" role="alert">{error}</p>}
              </div>
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Enquiry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
    </ThemeProvider>
    </>
  );
}
