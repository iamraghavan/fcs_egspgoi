import type { SVGProps } from"react";

export function Logo(props: SVGProps<SVGSVGElement>) {
 return (
 <svg
 xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 {...props}
 >
 <path d="M12 11c0-3.313 0-4.97 1.414-6.384C14.828 3.199 16.48 3 19.789 3c3.31 0 4.965.199 6.379 1.616C27.583 6.03 27.583 7.687 27.583 11c0 3.313 0 4.97-1.414 6.384C24.754 18.801 23.099 19 19.789 19c-3.31 0-4.965-.199-6.379-1.616C12 15.97 12 14.313 12 11zM12 11h15.583"/>
 <path d="M4 4h19.583v16H4z"/>
 </svg>
 );
}

export function LogoAdmin(props: SVGProps<SVGSVGElement>) {
 return (
 <svg fill="currentColor"viewBox="0 0 48 48"xmlns="http://www.w3.org/2000/svg"{...props}><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path></svg>
 )
}
