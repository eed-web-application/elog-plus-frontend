// https://github.com/FortAwesome/react-fontawesome/issues/232#issuecomment-1158654385
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { SVGProps } from "react";

export type FaIconProps = SVGProps<SVGSVGElement> & { icon: IconDefinition };

const xmlns = "http://www.w3.org/2000/svg";

export default function FaIcon(props: FaIconProps) {
  const { icon: iconProps, children, ...rest } = props;

  const { prefix, iconName, icon } = iconProps;
  const width = icon[0];
  const height = icon[1];
  const svgPathData = icon[4];

  const dataFa = `${prefix}-${iconName}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns={xmlns}
      role={"img"}
      aria-hidden="true"
      data-fa={dataFa}
      stroke="currentColor"
      fill="currentColor"
      {...rest}
    >
      {children}
      {Array.isArray(svgPathData) ? (
        <g>
          <path d={svgPathData[0]} />
          <path d={svgPathData[1]} />
        </g>
      ) : (
        <path d={svgPathData} />
      )}
    </svg>
  );
}
