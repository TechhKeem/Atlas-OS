import { useId } from "react";

export type GlassLogoIds = {
	id: (name: string) => string;
	url: (name: string) => string;
};

export const useGlassLogoIds = (): GlassLogoIds => {
	const prefix = `look-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
	return {
		id: (name) => `${prefix}-${name}`,
		url: (name) => `url(#${prefix}-${name})`,
	};
};

const LOOK_GREEN = "#30A46C";
const EYE_PATH =
	"M7 20C10.5 13.5 15 10.5 20 10.5S29.5 13.5 33 20C29.5 26.5 25 29.5 20 29.5S10.5 26.5 7 20Z";

export const GlassMark = (_props: { ids: GlassLogoIds }) => (
	<>
		<rect width="40" height="40" rx="10" fill="#20242D" />
		<path
			d={EYE_PATH}
			stroke="#F6F7F9"
			strokeWidth="2.6"
			strokeLinejoin="round"
		/>
		<circle cx="20" cy="20" r="5.2" fill={LOOK_GREEN} />
		<circle cx="20" cy="20" r="2" fill="#F6F7F9" />
	</>
);

export const GlassWordmark = ({
	white,
}: {
	ids: GlassLogoIds;
	white?: boolean;
}) => (
	<>
		<g
			className={white ? undefined : "stroke-gray-12"}
			stroke={white ? "#F6F7F9" : "#20242D"}
			strokeWidth="4.2"
			strokeLinecap="round"
			strokeLinejoin="round"
			fill="none"
		>
			<path d="M50 10.5V29.5" />
			<circle cx="62" cy="23" r="6.3" />
			<circle cx="78.5" cy="23" r="6.3" />
			<path d="M92 10.5V29.5M100.5 16.8L93.6 23.4M95.6 21.6L101 29.5" />
		</g>
		<circle cx="78.5" cy="23" r="2.2" fill={LOOK_GREEN} />
	</>
);
