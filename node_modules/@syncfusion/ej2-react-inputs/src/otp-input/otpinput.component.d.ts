import * as React from 'react';
import { OtpInput, OtpInputModel } from '@syncfusion/ej2-inputs';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
/**
 * Represents the React OtpInput Component
 * ```html
 * <OtpInputComponent value={value}></OtpInputComponent>
 * ```
 */
export declare class OtpInputComponent extends OtpInput {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<OtpInputModel | DefaultHtmlAttributes>;
    setState: any;
    private getDefaultAttributes;
    initRenderCalled: boolean;
    private checkInjectedModules;
    private statelessTemplateProps;
    private templateProps;
    private immediateRender;
    private isReactMock;
    props: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<OtpInputModel | DefaultHtmlAttributes>;
    forceUpdate: (callBack?: () => any) => void;
    context: Object;
    portals: any;
    isReactComponent: Object;
    refs: {
        [key: string]: React.ReactInstance;
    };
    constructor(props: any);
    render(): any;
}
