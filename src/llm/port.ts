import { MotionSpec } from '../contracts.js';
export interface ProposalProvider { propose(input: Readonly<{brief:string; approvedAssetIds:readonly string[]}>): Promise<unknown> }
export async function validateProposal(provider: ProposalProvider | undefined, brief:string, approvedAssetIds:readonly string[]) {
 if (!provider) return {status:'not_configured'} as const;
 const spec=MotionSpec.parse(await provider.propose({brief,approvedAssetIds}));
 if(spec.assetIds.some(id=>!approvedAssetIds.includes(id))) throw new Error('ASSET_NOT_AUTHORIZED');
 return {status:'proposal_only',spec} as const;
}
