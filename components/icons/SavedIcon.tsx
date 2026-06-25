import Svg, { Path } from 'react-native-svg';

export const SavedIcon = (props: any) => (
    <Svg
        width={props.size || 24}
        height={props.size || 24}
        viewBox="0 0 24 24"
        {...props}
    >
        <Path d="M17,18L12,15.82L7,18V5H17M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"
            fill={props.color || 'currentColor'} />
    </Svg>
);