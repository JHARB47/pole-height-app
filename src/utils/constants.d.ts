export namespace SURFACE_CATEGORIES {
    namespace pedestrian {
        let label: string;
        let commMin: number;
        let powerMin: number;
    }
    namespace residentialDrive {
        let label_1: string;
        export { label_1 as label };
        let commMin_1: number;
        export { commMin_1 as commMin };
        let powerMin_1: number;
        export { powerMin_1 as powerMin };
    }
    namespace publicRoad {
        let label_2: string;
        export { label_2 as label };
        let commMin_2: number;
        export { commMin_2 as commMin };
        let powerMin_2: number;
        export { powerMin_2 as powerMin };
    }
    namespace railroad {
        let label_3: string;
        export { label_3 as label };
        let commMin_3: number;
        export { commMin_3 as commMin };
        let powerMin_3: number;
        export { powerMin_3 as powerMin };
    }
}
export namespace VERTICAL_SEPARATION {
    let powerToComm: number;
    let commToComm: number;
}
export namespace MIN_ATTACH_HEIGHTS {
    export let primaryMin: number;
    export let secondaryMin: number;
    let commMin_4: number;
    export { commMin_4 as commMin };
}
export namespace SAG_DEFAULTS {
    let ADSS: number;
    let Coax: number;
    let Copper: number;
    let Triplex: number;
}
export namespace GUY_ANGLE_RANGE {
    let min: number;
    let max: number;
}
export const POLE_CLASS_HINT_LBF: {
    "Class 1": number;
    "Class 2": number;
    "Class 3": number;
    "Class 4": number;
    "Class 5": number;
};
export namespace FE_REQUIRED {
    let proposal: string[];
    let poleProfileMeta: string[];
}
export namespace WV_COMPANIES {
    let power: {
        name: string;
        short: string;
        parent: string;
    }[];
    let communication: {
        name: string;
        short: string;
    }[];
}
