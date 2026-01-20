import { Module } from "@nestjs/common";
import { ContractorsService } from "./contractors.service";
import { ContractorsController } from "./contractors.controller";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService],
})
export class ContractorsModule {}
