import * as React from 'react';
import { ColorPicker, ColorPickerModel } from '@syncfusion/ej2-inputs';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
/**
 * Represents the React ColorPicker Component
 * ```html
 * <ColorPickerComponent></ColorPickerComponent>
 * ```
 */
export declare class ColorPickerComponent extends ColorPicker {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<ColorPickerModel | DefaultHtmlAttributes>;
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
    }> & Readonly<ColorPickerModel | DefaultHtmlAttributes>;
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
