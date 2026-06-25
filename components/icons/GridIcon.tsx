import Svg, { Path } from 'react-native-svg';

export const GridIcon = (props: any) => (
    <Svg
        width={props.size || 24}
        height={props.size || 24}
        viewBox="0 0 24 24"
        {...props}
    >
        <Path d="M3 11H11V3H3M5 5H9V9H5M13 21H21V13H13M15 15H19V19H15M3 21H11V13H3M5 15H9V19H5M13 3V11H21V3M19 9H15V5H19Z"
            fill={props.color || 'currentColor'} />
    </Svg>
);