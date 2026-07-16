import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentCompanyId } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('administration.general')
  @ApiOperation({ summary: 'Crear nuevo usuario en la empresa' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.usersService.create(createUserDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios de la empresa' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.usersService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  @RequirePermissions('administration.general')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      companyId,
    );
  }

  @Delete(':id')
  @RequirePermissions('administration.general')
  @ApiOperation({
    summary: 'Eliminar un usuario. (esto lo elimina de todas las empresas)',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.usersService.remove(id, companyId);
  }
}
