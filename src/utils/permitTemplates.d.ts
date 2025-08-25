export function getTemplatesForEnvironment(env: any): any[];
export function buildTemplatesText(env: any): string;
export default permitTemplates;
declare namespace permitTemplates {
    namespace agencies {
        namespace wvdot {
            let name: string;
            let environments: string[];
            let resources: {
                label: string;
                url: string;
                notes: string;
            }[];
            let requirements: string[];
        }
        namespace penndot {
            let name_1: string;
            export { name_1 as name };
            let environments_1: string[];
            export { environments_1 as environments };
            let resources_1: {
                label: string;
                url: string;
                notes: string;
            }[];
            export { resources_1 as resources };
            let requirements_1: string[];
            export { requirements_1 as requirements };
        }
        namespace odot {
            let name_2: string;
            export { name_2 as name };
            let environments_2: string[];
            export { environments_2 as environments };
            let resources_2: {
                label: string;
                url: string;
                notes: string;
            }[];
            export { resources_2 as resources };
            let requirements_2: string[];
            export { requirements_2 as requirements };
        }
        namespace mdot {
            let name_3: string;
            export { name_3 as name };
            let environments_3: string[];
            export { environments_3 as environments };
            let resources_3: {
                label: string;
                url: string;
                notes: string;
            }[];
            export { resources_3 as resources };
            let requirements_3: string[];
            export { requirements_3 as requirements };
        }
        namespace csx {
            let name_4: string;
            export { name_4 as name };
            let environments_4: string[];
            export { environments_4 as environments };
            let resources_4: {
                label: string;
                url: string;
                notes: string;
            }[];
            export { resources_4 as resources };
            let requirements_4: string[];
            export { requirements_4 as requirements };
        }
    }
}
