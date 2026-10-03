export interface CurrentUser {
  id: number;
}

export class CurrentUserService {
  private static instance: CurrentUserService;
  private readonly user: CurrentUser;

  private constructor() {
    this.user = { id: 1 };
  }

  public static getInstance(): CurrentUserService {
    if (!CurrentUserService.instance) {
      CurrentUserService.instance = new CurrentUserService();
    }
    return CurrentUserService.instance;
  }

  public getCurrentUser(): CurrentUser {
    return this.user;
  }
}

export const getCurrentUser = (): CurrentUser => {
  return CurrentUserService.getInstance().getCurrentUser();
};
