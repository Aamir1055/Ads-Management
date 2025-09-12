import * as React from 'react';
import { SmartTextArea, SmartTextAreaModel } from '@syncfusion/ej2-inputs';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
/**
 * Represents the React Smart TextArea Component
 * ```html
 * <SmartTextArea></SmartTextArea>
 * ```
 */
export declare class SmartTextAreaComponent extends SmartTextArea {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<SmartTextAreaModel | DefaultHtmlAttributes>;
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
    }> & Readonly<SmartTextAreaModel | DefaultHtmlAttributes>;
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
