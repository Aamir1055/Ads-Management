import * as React from 'react';
import { Rating, RatingModel } from '@syncfusion/ej2-inputs';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
export interface RatingTypecast {
    fullTemplate?: string | Function | any;
    emptyTemplate?: string | Function | any;
    tooltipTemplate?: string | Function | any;
    labelTemplate?: string | Function | any;
}
/**
 * Represents the React Rating Component
 * ```html
 * <RatingComponent value={value}></RatingComponent>
 * ```
 */
export declare class RatingComponent extends Rating {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<RatingModel | DefaultHtmlAttributes | RatingTypecast>;
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
    }> & Readonly<RatingModel | DefaultHtmlAttributes | RatingTypecast>;
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
