import * as React from 'react';
import { SpeechToText, SpeechToTextModel } from '@syncfusion/ej2-inputs';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
/**
 * Represents the React SpeechToText Component
 * ```html
 * <SpeechToTextComponent></SpeechToTextComponent>
 * ```
 */
export declare class SpeechToTextComponent extends SpeechToText {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<SpeechToTextModel | DefaultHtmlAttributes>;
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
    }> & Readonly<SpeechToTextModel | DefaultHtmlAttributes>;
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
