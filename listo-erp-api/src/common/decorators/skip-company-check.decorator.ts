import { SetMetadata } from '@nestjs/common';
import { SKIP_COMPANY_CHECK_KEY } from '../guards/company-access.guard';

export const SkipCompanyCheck = () => SetMetadata(SKIP_COMPANY_CHECK_KEY, true);
