/**
 * Layer 0 — Institutional Governance Registry
 * Formalizes the roots, mandates, and global peers of the SANAS ecosystem.
 */

export type FunctionalCluster = 'DEVELOPMENT_FINANCE' | 'REGULATORY' | 'SQAM' | 'ENERGY' | 'TRANSPORT' | 'SCIENCE' | 'WATER' | 'GLOBAL';

export interface InstitutionalNode {
    id: string;
    name: string;
    acronym: string;
    parentDepartment: string;
    establishedBy?: string;
    legislation?: string;
    cluster: FunctionalCluster;
    mandate: string[];
    globalPeers: string[];
}

export const INSTITUTIONAL_GOVERNANCE_TREE: Record<string, InstitutionalNode> = {
    // SQAM Cluster (The Core of Lab Accreditation)
    sanas: {
        id: "node_sanas",
        name: "South African National Accreditation System",
        acronym: "SANAS",
        parentDepartment: "dtic",
        establishedBy: "Department of Trade and Industry (dti)",
        legislation: "Accreditation for Conformity Assessment, Calibration and Good Laboratory Practice Act (Act 19 of 2006)",
        cluster: "SQAM",
        mandate: [
            "Formal accreditation of testing and calibration laboratories",
            "Ensure international competitiveness",
            "Ensure technical competence"
        ],
        globalPeers: ["ISO", "IAF", "ILAC"]
    },
    sabs: {
        id: "node_sabs",
        name: "South African Bureau of Standards",
        acronym: "SABS",
        parentDepartment: "dtic",
        cluster: "SQAM",
        mandate: ["Develop and promote national standards"],
        globalPeers: ["ISO"]
    },
    nmisa: {
        id: "node_nmisa",
        name: "National Metrology Institute of South Africa",
        acronym: "NMISA",
        parentDepartment: "dtic",
        cluster: "SQAM",
        mandate: ["Maintain national measurement standards"],
        globalPeers: ["BIPM"]
    },
    nrcs: {
        id: "node_nrcs",
        name: "National Regulator for Compulsory Specifications",
        acronym: "NRCS",
        parentDepartment: "dtic",
        cluster: "SQAM",
        mandate: ["Manage mandatory safety and quality standards"],
        globalPeers: []
    },

    // Regulatory Cluster
    cipc: {
        id: "node_cipc",
        name: "Companies and Intellectual Property Commission",
        acronym: "CIPC",
        parentDepartment: "dtic",
        cluster: "REGULATORY",
        mandate: ["Business registration", "IP protection"],
        globalPeers: ["WIPO"]
    },
    comp_comm: {
        id: "node_comp_comm",
        name: "Competition Commission",
        acronym: "CC",
        parentDepartment: "dtic",
        cluster: "REGULATORY",
        mandate: ["Monitor market competition", "Prevent anti-competitive behavior"],
        globalPeers: ["OECD Competition Committee"]
    },

    // Global Governance Layer
    iso: {
        id: "node_iso",
        name: "International Organization for Standardization",
        acronym: "ISO",
        parentDepartment: "International",
        cluster: "GLOBAL",
        mandate: ["Parent of all management system standards (9001, 17025)"],
        globalPeers: []
    },
    iaf: {
        id: "node_iaf",
        name: "International Accreditation Forum",
        acronym: "IAF",
        parentDepartment: "International",
        cluster: "GLOBAL",
        mandate: ["Global association of accreditation bodies"],
        globalPeers: []
    },
    ilac: {
        id: "node_ilac",
        name: "International Laboratory Accreditation Cooperation",
        acronym: "ILAC",
        parentDepartment: "International",
        cluster: "GLOBAL",
        mandate: ["Global mutual recognition for testing and calibration laboratories"],
        globalPeers: []
    }
};
