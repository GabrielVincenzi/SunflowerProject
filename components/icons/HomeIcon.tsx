import Svg, { Path } from 'react-native-svg';

export const HomeIcon = (props: any) => (
    <Svg
        width={props.size || 24}
        height={props.size || 24}
        viewBox="0 0 24 24"
        {...props}
    >
        <Path d="M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22"
            fill={props.color || 'currentColor'} />
    </Svg>
);